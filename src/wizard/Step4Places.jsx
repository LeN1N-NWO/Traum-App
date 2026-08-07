import CastStep from "./CastStep.jsx";
import { t } from "../i18n/index.js";

export default function Step4Places(props) {
  return (
    <CastStep
      {...props}
      kind="place"
      title={t.wizard.step4.title}
      lede={t.wizard.step4.lede}
      emptyText={t.wizard.step4.empty}
      nextStep={5}
    />
  );
}
