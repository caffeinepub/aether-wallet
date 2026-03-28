import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { useQuery } from "@tanstack/react-query";

const ICRC1_IDL = ({ IDL }: { IDL: any }) => {
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  return IDL.Service({
    icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ["query"]),
  });
};

export function useIcrc1Balance(
  canisterId: string,
  principalStr: string | undefined,
) {
  return useQuery<number>({
    queryKey: ["icrc1_balance", canisterId, principalStr],
    queryFn: async () => {
      if (!principalStr) return 0;
      const agent = await HttpAgent.create({ host: "https://icp-api.io" });
      const actor = Actor.createActor(ICRC1_IDL, { agent, canisterId });
      const balance = await (actor as any).icrc1_balance_of({
        owner: Principal.fromText(principalStr),
        subaccount: [],
      });
      return Number(balance);
    },
    enabled: !!principalStr,
    staleTime: 30_000,
  });
}
