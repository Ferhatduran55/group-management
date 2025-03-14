import { ErrorBoundary, For, Suspense } from "solid-js";
import { createAsync, query } from "@solidjs/router";
import StudentCard from "~/components/StudentCard";
import Database from "~/services/Database";

const getStudents = query(async () => {
  const response = await Database.findAllIn("students");
  return (await response) as Student[];
}, "students");

export const route = {
  preload: () => getStudents(),
};

export default function StudentList() {
  const students = createAsync(() => getStudents());

  return (
    <ul style={{ display: "flex", "flex-wrap": "wrap", gap: "1rem" }}>
      <ErrorBoundary fallback={<div>Failed to load students</div>}>
        <Suspense fallback={<div>Loading...</div>}>
          <For each={students()}>
            {(student) => <StudentCard content={student} />}
          </For>
        </Suspense>
      </ErrorBoundary>
    </ul>
  );
}
