'use client';

import PartCreateSidebar from '@/features/prototype/components/molecules/PartCreateSidebar';
import PartPropertySidebar from '@/features/prototype/components/molecules/PartPropertySidebar';
import { Part, PartProperty, Player } from '@/types/models';

export default function EditSidebars({
  prototypeName,
  prototypeVersionNumber,
  groupId,
  players,
  selectedPart,
  selectedPartProperties,
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
  selectedPartProperties: PartProperty[] | null;
  onAddPart: (part: Part, properties: PartProperty[]) => void;
  onDeletePart: () => void;
  updatePart: (
    partId: number,
    updatePart?: Partial<Part>,
    updateProperties?: Partial<PartProperty>[],
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
        selectedPartProperties={selectedPartProperties}
        onAddPart={onAddPart}
        onDeletePart={onDeletePart}
        updatePart={updatePart}
      />
    </>
  );
}
