export default function GroupWrapper(props: GroupWrapperProps) {
  const { content } = props;
  return (
    <details style={{ border: "1px solid #ccc", padding: "1rem" }}>
      <h1>{content.groupName}</h1>
      {content.students?.join(", ")}
    </details>
  );
}
