import { Show, For } from "solid-js";
import { query, createAsync, action, useSubmission } from "@solidjs/router";
import Database from "~/services/Database";
import { convertKeysToCamelCase } from "~/utils";

const getSectionData = query(async (sectionId: string) => {
  const section = await Database.findOne("sections", { identifier: sectionId });
  return convertKeysToCamelCase(section);
}, "sectionData");

const getUnassignedStudents = query(async (sectionId: string) => {
  const allStudents = await Database.findAllIn("students");
  const allGroups = await Database.find("groups", { section_id: sectionId });
  const assigned = allGroups.flatMap((g: any) => g.students || []);
  return allStudents.filter((s) => !assigned.includes(s.id));
}, "unassignedStudents");

const addStudentToGroup = action(async (formData: FormData) => {
  "use server";
  const groupId = formData.get("groupId")?.toString();
  const studentId = formData.get("studentId")?.toString();
  if (!groupId || !studentId) return;
  const group = await Database.findOne("groups", { identifier: groupId });
  if (!group) return;
  if ((group.students?.length || 0) >= group.maxStudents) {
    return;
  }
  group.students = [...(group.students || []), studentId];
  await Database.updateOne(
    "groups",
    { identifier: groupId },
    { students: group.students }
  );
  return { success: true };
}, "addStudentToGroup");

const removeStudentFromGroup = action(async (formData: FormData) => {
  "use server";
  const groupId = formData.get("groupId")?.toString();
  const studentId = formData.get("studentId")?.toString();
  const group = await Database.findOne("groups", { identifier: groupId });
  if (!group || !studentId) return;
  group.students = (group.students || []).filter(
    (sid: string) => sid !== studentId
  );
  await Database.updateOne(
    "groups",
    { identifier: groupId },
    { students: group.students }
  );
  return { success: true };
}, "removeStudentFromGroup");

const getGroupStudents = query(async (groupId: string) => {
  const group = await Database.findOne("groups", { identifier: groupId });
  if (!group?.students) return [];
  const allStudents = await Database.findAllIn("students");
  return allStudents.filter((s: Student) => (group.students || []).includes(s.id));
}, "groupStudents");

export default function GroupWrapper(props: GroupWrapperProps) {
  const { content } = props;
  const sectionData = createAsync(() => getSectionData(content.sectionId));
  const unassigned = createAsync(() =>
    getUnassignedStudents(content.sectionId)
  );
  const submission = useSubmission(addStudentToGroup);
  const groupStudents = createAsync(() => getGroupStudents(content.identifier));

  return (
    <details style={{ border: "1px solid #ccc", padding: "1rem" }}>
      <summary>
        {content.groupName} |{" "}
        <span
          style={{
            color:
              (content.students?.length || 0) >= content.maxStudents
                ? "red"
                : "inherit",
          }}
        >
          {content.students?.length || 0}/{content.maxStudents}
        </span>
      </summary>
      <ol class="group-students">
        <For each={groupStudents()}>
          {(student) => (
            <li>
              <form
                action={removeStudentFromGroup}
                method="post"
              >
                <input
                  type="hidden"
                  name="groupId"
                  value={content.identifier}
                />
                <input type="hidden" name="studentId" value={student.id} />
                <button type="submit" class="remove-student">
                  -
                </button>
              </form>
              {student.id} - {student.name} {student.surname}
            </li>
          )}
        </For>
      </ol>
      <Show when={(content.students?.length || 0) < content.maxStudents}>
        <Show when={sectionData()?.randomizeGroupAssignment}>
          <form action={addStudentToGroup} method="post">
            <input type="hidden" name="groupId" value={content.identifier} />
            <select name="studentId">
              <For each={unassigned()}>
                {(student) => (
                  <option value={student.id}>
                    {student.name} {student.surname}
                  </option>
                )}
              </For>
            </select>
            <button type="submit">Assign Student</button>
          </form>
        </Show>
        <Show when={sectionData()?.randomizeGroupAssignment}>
          <form action={addStudentToGroup} method="post">
            <input type="hidden" name="groupId" value={content.identifier} />
            <input
              type="hidden"
              name="studentId"
              value={
                unassigned()?.length
                  ? unassigned()[
                      Math.floor(Math.random() * unassigned().length)
                    ].id
                  : ""
              }
            />
            <button type="submit">Randomize Student Assignment</button>
          </form>
        </Show>
      </Show>
      <Show when={submission.pending}>
        <div>Student assigment process...</div>
      </Show>
      <Show when={submission.error}>
        <div>
          An error occurred: {submission.error?.message || submission.error}
        </div>
      </Show>
      <Show when={(content.students?.length || 0) >= content.maxStudents}>
        <div>The group is full. No more students can be added.</div>
      </Show>
    </details>
  );
}
