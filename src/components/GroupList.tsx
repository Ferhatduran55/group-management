import { For, Show } from "solid-js";
import { action, useSubmission, query, createAsync } from "@solidjs/router";
import Database from "~/services/Database";
import GroupWrapper from "./GroupWrapper";
import { convertKeysToCamelCase, convertKeysToSnakeCase } from "~/utils";

const getGroups = query(async (sectionId: string) => {
  return convertKeysToCamelCase(
    await Database.findWithRelations("groups", { section_id: sectionId }, [
      { key: "section_id", refSchema: "sections", refKey: "identifier" },
    ])
  );
}, "groups");

const formatData = (formData: FormData) => {
  const data: Record<string, any> = {};
  for (const [key, val] of formData.entries()) {
    data[key] = val === "on" ? true : val;
  }
  return convertKeysToSnakeCase(data);
};

const addGroup = action(async (formData: FormData) => {
  "use server";
  const data = formatData(formData);
  await Database.insertOne("groups", data);
}, "addGroup");

export default function GroupList(props: SectionWrapperProps) {
  const { content } = props;

  const groups = createAsync(() => getGroups(content.identifier));
  const submission = useSubmission(addGroup);
  return (
    <main>
      <form action={addGroup} method="post">
        <input type="hidden" name="sectionId" value={content.identifier} />
        <div>
          <label for="groupName">Group Name</label>
          <input name="groupName" />
        </div>
        <div>
          <label for="maxStudents">Maximum Students</label>
          <input
            name="maxStudents"
            type="number"
            placeholder={`${content.defaultMaxStudentsPerGroup}`}
            value={content.defaultMaxStudentsPerGroup}
          />
        </div>
        <button>Add Group</button>
        <Show when={submission.pending}>
          {submission.input?.[0]?.get("groupName")?.toString()}
        </Show>
      </form>
      <ul style={{ display: "flex", gap: "1rem", "flex-wrap": "wrap", "justify-content": "space-between" }}>
        <For each={groups()}>{(group) => <GroupWrapper content={group} />}</For>
      </ul>
    </main>
  );
}
