import { Title } from "@solidjs/meta";
import SectionList from "~/components/SectionList";
import StudentList from "~/components/StudentList";

export default function Home() {
  return (
    <main>
      <Title>Group Management</Title>
      <SectionList />
      <StudentList />
    </main>
  );
}
