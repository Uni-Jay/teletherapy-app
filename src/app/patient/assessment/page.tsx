import { PageHeader } from "@/components/ui/misc";
import { AssessmentForm } from "@/components/assessment-form";

export const metadata = { title: "Assessment" };

export default function AssessmentPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Wellbeing assessment"
        text="7 quick questions. This is not a diagnosis. It helps us suggest the right therapist and lets you track how you feel over time."
      />
      <AssessmentForm />
    </div>
  );
}
