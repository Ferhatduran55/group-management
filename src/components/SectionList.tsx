import { For, Show } from "solid-js";
import { action, useSubmission, query, createAsync } from "@solidjs/router";
import SectionWrapper from "./SectionWrapper";
import Database from "~/services/Database";
import { convertKeysToCamelCase, convertKeysToSnakeCase } from "~/utils";

const getSections = query(async () => {
  const sections = await Database.find("sections");
  return convertKeysToCamelCase(sections);
}, "sections");

const formatData = (formData: FormData) => {
  const data: Record<string, any> = {};
  for (const [key, val] of formData.entries()) {
    data[key] = val === "on" ? true : val;
  }
  return convertKeysToSnakeCase(data);
};

const addSection = action(async (formData: FormData) => {
  "use server";
  const data = formatData(formData);
  await Database.insertOne("sections", data);
}, "addSection");

export default function SectionList() {
  const sections = createAsync(() => getSections());
  const submission = useSubmission(addSection);
  return (
    <main>
      <form
        action={addSection}
        method="post"
        style={{
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
          gap: "1rem",
        }}
      >
        <div>
          <label for="sectionName">Section Name</label>
          <input name="sectionName" />
        </div>
        <div>
          <label for="randomizeGroupAssignment">
            Randomize Group Assignment
          </label>
          <input type="checkbox" name="randomizeGroupAssignment" />
        </div>
        <div>
          <label for="studentCanJoinMultipleGroups">
            Student Can Join Multiple Groups
          </label>
          <input type="checkbox" name="studentCanJoinMultipleGroups" />
        </div>
        <div>
          <label for="defaultMaxStudentsPerGroup">
            Default Max Students Per Group
          </label>
          <input type="number" name="defaultMaxStudentsPerGroup" />
        </div>
        <button>Add Section</button>
        <Show when={submission.pending}>
          {submission.input?.[0]?.get("sectionName")?.toString()}
        </Show>
      </form>
      <ul>
        <For each={sections()}>
          {(section) => <SectionWrapper content={section} />}
        </For>
      </ul>
    </main>
  );
}
