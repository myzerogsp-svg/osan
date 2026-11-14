import { createFileRoute } from "@tanstack/react-router";
import { Home } from "@/dashboard";

export const Route = createFileRoute("/")({ component: Home });
