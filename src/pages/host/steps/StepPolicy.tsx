import type { VoteCreateDraft } from "../../../types/host";

interface StepPolicyProps {
  draft: VoteCreateDraft;
  onUpdate: <K extends keyof VoteCreateDraft>(
    key: K,
    value: VoteCreateDraft[K],
  ) => void;
}

export function StepPolicy({ draft, onUpdate }: StepPolicyProps) {
  return (
    <>
      <div
        className="hidden"
        data-step-policy-unused
        data-title={draft.title}
        onClick={() => onUpdate("title", draft.title)}
      />
    </>
  );
}
