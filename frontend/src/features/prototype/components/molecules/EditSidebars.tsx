'use client';

import PartCreateSidebar from '@/features/prototype/components/molecules/PartCreateSidebar';
import PartPropertySidebar from '@/features/prototype/components/molecules/PartPropertySidebar';
import { Part, Player } from '@/types/models';

export default function EditSidebars({
  prototypeName,
  prototypeVersionNumber,
  groupId,
  players,
  selectedPart,
  onAddPart,
  onDeletePart,
  updatePart,
  mainViewRef,
}: {
  prototypeName: string;
  prototypeVersionNumber?: string;
  groupId: string;
  players: Player[];
  selectedPart: Part | null;
  onAddPart: (part: Part) => void;
  onDeletePart: () => void;
  updatePart: (
    partId: number,
    updatePart: Partial<Part>,
    isFlipped?: boolean
  ) => void;
  mainViewRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <>
      {/* Left Sidebar */}
      <PartCreateSidebar
        prototypeName={prototypeName}
        prototypeVersionNumber={prototypeVersionNumber}
        groupId={groupId}
        players={players}
        onAddPart={onAddPart}
        mainViewRef={mainViewRef}
      />

      {/* Right Sidebar */}
      <PartPropertySidebar
        groupId={groupId}
        players={players}
        selectedPart={selectedPart}
        onAddPart={onAddPart}
        onDeletePart={onDeletePart}
        updatePart={updatePart}
      />
    </>
  );
}
