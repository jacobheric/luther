import { Chat } from "@/islands/chat.tsx";
import { getNeonAuthUrl } from "@/lib/neon_auth.ts";

const Index = () => (
  <div className="flex flex-col w-full">
    <Chat authUrl={getNeonAuthUrl()} />
  </div>
);

export default Index;
