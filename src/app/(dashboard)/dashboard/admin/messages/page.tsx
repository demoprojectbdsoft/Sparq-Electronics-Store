import { getMessages } from "@/lib/api/message";
import AdminMessagesClient from "./AdminMessagesClient";

export const dynamic = "force-dynamic";

interface AdminMessagesPageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
    sort?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function AdminMessagesPage({ searchParams }: AdminMessagesPageProps) {
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const limit = Number(params?.limit) || 10;

  // Only forward the filters that were actually used.
  const res = await getMessages({
    status: params?.status,
    search: params?.search,
    sort: params?.sort,
    page,
    limit,
  });

  const messages = Array.isArray(res?.data?.messages) ? res.data.messages : [];

  const pagination = res?.data?.pagination ?? {
    page,
    limit,
    total: messages.length,
    totalPages: 1,
  };

  return <AdminMessagesClient initialMessages={messages} pagination={pagination} />;
}
