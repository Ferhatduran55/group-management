export default function StudentCard(props: StudentCardProps) {
  const { content } = props;
  return (
    <div style={{ border: "1px solid #ccc", padding: "1rem" }}>
      <h3>
        {content.id} - {content.name} {content.surname}
      </h3>
    </div>
  );
}
