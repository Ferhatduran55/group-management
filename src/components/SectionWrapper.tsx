import GroupList from "./GroupList";

export default function SectionWrapper(props: SectionWrapperProps) {
  const { content } = props;

  return (
    <section style={{ border: "1px solid #ccc", padding: "1rem" }}>
      <h3>{content.sectionName}</h3>
      <a href={`/export/${content.identifier}?type=pdf`} target="_blank">
        Export PDF
      </a>
      <a href={`/export/${content.identifier}?type=excelunassigned`} target="_blank">
        Export Unassigned Students (Excel)
      </a>
      <GroupList content={content} />
    </section>
  );
}
