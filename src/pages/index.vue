<template>
	<div class="auth-container">
		<authenticator>
			<template v-slot:sign-in-header>
				<h2 style="padding: var(--amplify-space-xl) 0 0 var(--amplify-space-xl)">チャットアプリへようこそ</h2>
				<h3 style="padding: var(--amplify-space-xl) 0 0 var(--amplify-space-xl)">
					Sign in to your account
				</h3>
			</template>
			<template v-slot:sign-up-header>
				<h3 style="padding: var(--amplify-space-xl) 0 0 var(--amplify-space-xl)">
					Create a new account
				</h3>
			</template>
			<template v-slot="{ user, signOut }">
				<div class="user-greeting">
					<Home/>
				</div>
			</template>
		</authenticator>
	</div>
</template>

<script setup lang="ts">
import { Authenticator } from "@aws-amplify/ui-vue";
import Home from "./home";
import "@aws-amplify/ui-vue/styles.css";

</script>

<style>
.auth-container {
	height: 100vh;
	display: flex;
	justify-content: center;
	align-items: center;
}

.user-greeting {
	text-align: center;
	margin-bottom: 20px;
}
</style>