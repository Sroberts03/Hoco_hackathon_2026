import { buttonClass } from "@/components/ui";
import { signOut } from "../server/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button type="submit" className={buttonClass("secondary", "sm")}>
        Log out
      </button>
    </form>
  );
}
