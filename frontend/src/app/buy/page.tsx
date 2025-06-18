import { PackService } from "@/lib/backend/data/data-service";
import BuyClientPage from "@/pages/buy-client-page";


export default async function BuyPage() {
  const packs = await PackService.getAllPacks();
  if (!packs) {
    return <div>Error loading packs.</div>;
  }
  return (
    <BuyClientPage packs={packs}/>
  );
}

