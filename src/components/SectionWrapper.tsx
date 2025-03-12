import { For } from "solid-js";
import { query, createAsync } from "@solidjs/router";
import Database from "~/services/Database";
import { convertKeysToCamelCase } from "~/utils";
import GroupWrapper from "./GroupWrapper";

const getGroups = query(async (sectionId: string) => {
  return convertKeysToCamelCase(
    await Database.findWithRelations("groups", { section_id: sectionId }, [
      { key: "section_id", refSchema: "sections", refKey: "identifier" },
    ])
  );
}, "groups");

export default function SectionWrapper(props: SectionWrapperProps) {
  const { content } = props;

  const groups = createAsync(() => getGroups(content.identifier));
  return (
    <section style={{ border: "1px solid #ccc", padding: "1rem" }}>
      <h3>{content.sectionName}</h3>
      <ul style={{ display: "flex", gap: "1rem" }}>
        <For each={groups()}>{(group) => <GroupWrapper content={group} />}</For>
      </ul>
    </section>
  );
}
