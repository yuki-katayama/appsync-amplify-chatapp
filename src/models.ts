import type { Message } from "@/API";
import type { GetUrlOutput } from 'aws-amplify/storage'

export interface User {
	username: string;
	userId: string;
	signInDetails: {
		loginId: string;
		authFlowType: string;
	}
}

export type StorageAccessLevel = 'public' | 'protected' | 'private'


// Message型の拡張
export interface MessageWithImgUrl extends Message {
  imgUrl: GetUrlOutput; // imgUrlプロパティを追加
}
