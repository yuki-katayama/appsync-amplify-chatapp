<template>
	<div class="chat-container">
	  <div class="messages">
		<div v-for="message in messages" :key="message.id" class="message" :class="message.name === user.signInDetails.loginId ? 'self' : ''">
		  <div class="message-bubble" :class="message.name === user.signInDetails.loginId ? 'self' : ''">
			<p class="message-content">{{ message.content }}</p>
			<figure v-if="message.imgUrl">
			  <img :src="message.imgUrl.url.href" alt="Message Image"/>
			</figure>
		  </div>
		  <p class="message-sender">{{ message.name }}</p>
		  <span class="timestamp">{{ formatDate(message.createdAt) }}</span>
		</div>
	  </div>
	  <div class="input-area">
		<textarea v-model="inputMessage" placeholder="Type a message"></textarea>
		<button @click="onSendMessage">Send</button>
		<button @click="onLogout">Logout</button>
	  </div>
	  <div>
		<v-file-input v-model="fileinput" label="File input" @change="onFileChange" clearable></v-file-input>
		<div v-if="previewUrl">
			<img :src="previewUrl" alt="Preview" />
		</div>
	  </div>
	</div>
  </template>

<script setup lang="ts">
import { ref, onUnmounted, onMounted, watch, nextTick } from 'vue';
import { generateClient } from "aws-amplify/api";
import { listMessages } from "@/graphql/queries";
import { createMessage } from "@/graphql/mutations";
import { onCreateMessage } from "@/graphql/subscriptions";
import "@aws-amplify/ui-vue/styles.css";
import { useAuthenticator } from "@aws-amplify/ui-vue";
import type { User, MessageWithImgUrl } from "@/models";
import { uploadData, getUrl } from 'aws-amplify/storage';

const auth=useAuthenticator();
const client=generateClient();
const createSub=ref<any>(null);

const user=ref<User>(auth.user); // リアクティブな参照としてユーザー情報を保持
const messages=ref<MessageWithImgUrl[]>([]);
const inputMessage=ref('');

const fileinput=ref<File[]>([])
const previewUrl=ref<string | null>(null)

const formatDate=(date: string) => {
	const originalDate=new Date(date);

	const month=String(originalDate.getMonth()+1).padStart(2, '0'); // 月は0-indexedなので+1する
	const day=String(originalDate.getDate()).padStart(2, '0');
	const hours=String(originalDate.getHours()).padStart(2, '0');
	const minutes=String(originalDate.getMinutes()).padStart(2, '0');

	const formattedDate=`${month}/${day} ${hours}:${minutes}`;
	return formattedDate;
}

const onFileChange = (event: any) => {
      const file = event.target.files[0];
      previewUrl.value = URL.createObjectURL(file);
      // ここでファイルをサーバーにアップロード
}

const uploadFiles=async () => {
	if (fileinput.value.length>0) {
		try {
			return await uploadData({
				key: fileinput.value[0].name,
				data: fileinput.value[0],
			}).result;
		} catch (error) {
			console.log('Error : ', error);
		}
	}
	return null;
};

watch(() => auth.user, (newUser: User) => {
	console.log("Authenticated user:", newUser);
	user.value=newUser; // ユーザー情報の更新
});

const onSendMessage=async () => {
	console.log(user.value.signInDetails.loginId, inputMessage.value)
	const file=await uploadFiles();
	await client.graphql({
		query: createMessage,
		variables: {
			input: {
				name: user.value.signInDetails.loginId,
				content: inputMessage.value,
				img: file? file.key:""
			}
		}
	});
};

// メッセージを取得し、createdAtで降順に並び替える関数
const getMessages=async () => {
	const result=await client.graphql({
		query: listMessages
	});

	const messagesWithImgUrl=await Promise.all((result.data.listMessages.items as  MessageWithImgUrl[]).map(async (message: MessageWithImgUrl) => {
		if (message.img) {
			console.log(message.img);
			message.imgUrl=await getUrl({
				key: message.img,
				options: {
					expiresIn: 60*60
				}
			});
		}
		return message;
	}));

	messages.value=messagesWithImgUrl.sort((a, b) => new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime());
};


// メッセージリストを監視し、変更があるたびに自動スクロール
watch(messages, async () => {
	await nextTick(); // DOMの更新を待つ
	const messagesContainer=document.querySelector('.messages');
	if (messagesContainer) {
		messagesContainer.scrollTop=messagesContainer.scrollHeight; // スクロール位置を最下部に設定
	}
}, { deep: true }); // deepオプションでネストされたプロパティの変更も監視

onMounted(async () => {
	// Subscribe to creation of Todo
	await getMessages();
	createSub.value=client
		.graphql({ query: onCreateMessage })
		.subscribe({
			next: async (data: any) => {
				console.log("triggered onCreateTodo");
				console.log(data);
				previewUrl.value=null;
				fileinput.value=[];
				inputMessage.value="";
				await getMessages();
			},
			error: (error: any) => console.warn(error)
		});
});

const onLogout=() => {
	auth.signOut();
};

onUnmounted(() => {
	if (createSub.value) {
		createSub.value.unsubscribe();
	}
});
</script>

<style scoped lang="scss">
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

	.message {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	margin-bottom: 15px;
	animation: fadeIn 0.5s ease;

	@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(20px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
	}

  &.self {
    align-items: flex-end;
  }
  .message-bubble {
    max-width: 70%;
    padding: 10px;
    border-radius: 20px;
    background-color: #f0f0f0;
    &.self {
      background-color: #dcf8c6;
    }
    img {
      max-width: 200px;
      border-radius: 10px;
    }
  }
  .message-content {
    margin: 0;
  }
  .message-sender {
    font-size: 0.8em;
    opacity: 0.8;
  }
  .timestamp {
    font-size: 0.7em;
    opacity: 0.7;
  }
}

.input-area {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background-color: #f0f0f0;
  gap: 1em;
  textarea {
    flex: 1;
    margin-right: 10px;
    padding: 10px;
    border: none;
    border-radius: 20px;
    resize: none;
  }
  button {
    padding: 10px 20px;
    border: none;
    border-radius: 20px;
    background-color: #4CAF50;
    color: white;
    cursor: pointer;
    &:hover {
      background-color: #45a049;
    }
  }
}

</style>