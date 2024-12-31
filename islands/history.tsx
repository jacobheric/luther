import { type History as HistoryType } from "@/routes/index.tsx";
import { useEffect, useState } from "preact/hooks";
import Search from "tabler-icons/tsx/search.tsx";
import X from "tabler-icons/tsx/x.tsx";

export const HistoryModal = (
  { modalId, search }: {
    modalId: string;
    search: (search?: string) => void;
  },
) => {
  const [history, setHistory] = useState<HistoryType[]>([]);

  const getHistory = async () => {
    const response = await fetch(`/api/history`);
    setHistory(JSON.parse(await response.text()));
  };

  useEffect(() => {
    getHistory();
  }, []);

  const deleteSearchHistory = async (id: number) => {
    const response = await fetch(`/api/history/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      console.error("failed to delete search history", response);
      return;
    }

    setHistory(history.filter((item) => item.id !== id));
  };

  return (
    <div className="flex flex-col gap-2 w-full dark:text-white text-gray-900">
      {history.map((item, i) => (
        <div
          className={`flex flex-row justify-start items-center gap-2 ${
            i === history.length - 1 ? "" : "border-b pb-2"
          }`}
        >
          <X
            className="cursor-pointer w-5 shrink-0"
            onClick={() => deleteSearchHistory(item.id)}
          />
          <div
            className="flex flex-row justify-start items-center gap-2 cursor-pointer"
            onClick={() => {
              search(item.search);
              (document.getElementById(modalId) as HTMLDialogElement)
                ?.close();
            }}
          >
            <Search className="w-5 shrink-0" />
            {item.search}
          </div>
        </div>
      ))}
    </div>
  );
};
