import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Transaction } from "../backend";
import { useActor } from "./useActor";

export function useBalance() {
  const { actor, isFetching } = useActor();
  return useQuery<number>({
    queryKey: ["balance"],
    queryFn: async () => {
      if (!actor) return 0;
      return actor.getBalance();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePrincipal() {
  const { actor, isFetching } = useActor();
  return useQuery<string>({
    queryKey: ["principal"],
    queryFn: async () => {
      if (!actor) return "";
      return actor.getPrincipal();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTransactions() {
  const { actor, isFetching } = useActor();
  return useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTransactions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSeedDemoData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.seedDemoData();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

export function useSendICP() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      to,
      amount,
      stealth,
    }: { to: string; amount: number; stealth: boolean }) => {
      if (!actor) throw new Error("No actor");
      return actor.sendICP(to, amount, stealth);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

export function useReceiveICP() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ from, amount }: { from: string; amount: number }) => {
      if (!actor) throw new Error("No actor");
      return actor.receiveICP(from, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

export function useToggleVisibility() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (txId: string) => {
      if (!actor) throw new Error("No actor");
      return actor.toggleTransactionVisibility(txId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
