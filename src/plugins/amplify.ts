import { defineNuxtPlugin } from "#app";
import { Amplify } from "aws-amplify";
import awsExports from "@/aws-exports";

export default defineNuxtPlugin(() => {
  Amplify.configure(awsExports);
});