<template>
	<label>名前</label>
	<input v-model="inputName"><br>
	<label>すること</label>
	<input v-model="inputDescription"><br>
	<button @click="createTodo()">createTodo</button>
	<button @click="getTodoList()">getTodoList</button>
	<button @click="unSubscribeCreateTodo()">unSubscribeCreateTodo</button>
	<button @click="subscribeCreateTodo()">subscribeCreateTodo</button>
	<table>
		<thead>
			<tr>
				<th>id</th>
				<th>名前</th>
				<th>すること</th>
			</tr>
		</thead>
		<tbody>
			<tr v-for="todo in todoList" :key="todo.id">
				<td>{{todo.id}}</td>
				<td>{{todo.name}}</td>
				<td>{{todo.description}}</td>
			</tr>
		</tbody>
	</table>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { generateClient } from "aws-amplify/api";
import * as queries from "@/graphql/queries";
import * as mutations from "@/graphql/mutations";
import * as subscriptions from "@/graphql/subscriptions";
import * as models from "@/API"

const todoList=ref<models.Todo[]>([])
const inputName=ref<string>("")
const inputDescription=ref<string>("")
const createSub=ref<any>(null)
const client=generateClient();

const createTodo=async () => {
	await client.graphql({
		query: mutations.createTodo,
		variables: {
			input: {
				name: inputName.value,
				description: inputDescription.value
			}
		}
	})
	inputName.value=""
	inputDescription.value=""
}

const getTodoList=async () => {
	const result=await client.graphql({
		query: queries.listTodos
	})
	todoList.value=result.data.listTodos.items
}

const unSubscribeCreateTodo=async () => {
	createSub.value.unsubscribe();
}

const subscribeCreateTodo=async () => {
	// Subscribe to creation of Todo
	createSub.value=client
		.graphql({ query: subscriptions.onCreateTodo })
		.subscribe({
			next: (data: any) => {
				console.log("triggered onCreateTodo")
				console.log(data)
			},
			error: (error: any) => console.warn(error)
		});
}

onUnmounted(() => {
	createSub.value.unsubscribe();
	console.log("unsubscribed");
});
</script>

<style>
th,
td {
	border: 1px solid rgb(160 160 160);
	padding: 8px 10px;
}
</style>