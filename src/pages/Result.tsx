import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useI18n } from "../i18n";
import { deleteScan, getScan } from "../lib/store";
import type { ScanRecord } from "../lib/types";
import SpeciesView from "../components/SpeciesView";
import { PageHeader, Spinner } from "../components/ui";

export default function Result() {
  const { id } = useParams();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [scan, setScan] = useState<ScanRecord | null | undefined>(undefined);

  useEffect(() => {
    if (id) getScan(id).then((s) => setScan(s ?? null)).catch(() => setScan(null));
  }, [id]);

  async function remove() {
    if (!id) return;
    await deleteScan(id);
    navigate("/", { replace: true });
  }

  if (scan === undefined) return <Spinner className="m-8 text-ink-soft" />;
  if (scan === null)
    return (
      <div>
        <PageHeader title={t("err.notFound")} back />
      </div>
    );

  const deleteButton = (
    <div className="mt-6 px-5">
      <button onClick={remove} className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
        <Trash2 size={16} aria-hidden />
        {t("result.delete")}
      </button>
    </div>
  );

  if (!scan.ai.isOrganism || !scan.ai.candidates?.length) {
    return (
      <div>
        <PageHeader title={t("result.none")} sub={scan.ai.photoNote || t("result.noneBody")} back />
        <img src={scan.image} alt={t("result.yourPhoto")} className="mx-5 max-h-[50dvh] w-[calc(100%-2.5rem)] rounded-[1.75rem] object-cover" />
        {deleteButton}
      </div>
    );
  }

  return (
    <div>
      <PageHeader back />
      <SpeciesView species={scan.species} ai={scan.ai} userImage={scan.image} scannedAt={scan.createdAt} />
      {deleteButton}
    </div>
  );
}
