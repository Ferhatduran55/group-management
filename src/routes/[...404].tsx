import { Title } from "@solidjs/meta";
import { HttpStatusCode } from "@solidjs/start";

export default function NotFound() {
  return (
    <main>
      <Title>Internal Error</Title>
      <HttpStatusCode code={500} />
      <h1>Cannot accessible service</h1>
    </main>
  );
}
