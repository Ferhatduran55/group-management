/// <reference types="@solidjs/start/env" />

declare namespace DBContext {
  type Identifier = string;

  interface User {}
}

type Section = {
  identifier: string;
  sectionName: string;
  studentCanJoinMultipleGroups: boolean | false;
  randomizeGroupAssignment: boolean | false;
  defaultMaxStudentsPerGroup: number | 0;
  groups?: Group[];
};

type Group = {
  identifier: string;
  sectionId: string;
  groupName: string;
  maxStudents: number;
  students?: Student[];
};

type Student = {
  identifier: string;
  id: number;
  name: string;
  surname: string;
};

interface StudentCardProps {
  content: Student;
}

interface SectionWrapperProps {
  content: Section;
}

interface GroupWrapperProps {
  content: Group;
}
