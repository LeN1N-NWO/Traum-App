import CastStep from "./CastStep.jsx";
import { t } from "../i18n/index.js";

export default function Step3Cast(props) {
  return (
    <CastStep
      {...props}
      kind="person"
      title={t.wizard.step3.title}
      lede={t.wizard.step3.lede}
      emptyText={t.wizard.step3.empty}
      nextStep={4}
    />
  );
}
