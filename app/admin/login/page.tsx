import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminLogin() {
  async function loginAction(formData: FormData) {
    "use server";
    const passcode = formData.get("passcode");
    if (typeof passcode === "string" && passcode.length > 0) {
      cookies().set("admin_auth", passcode, { 
        path: "/", 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 86400 
      });
      redirect("/admin");
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center py-8 px-4">
      <Card className="w-full max-w-sm bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-xl">Admin Access</CardTitle>
          <CardDescription className="text-slate-500">
            Enter the passcode to control the demo simulation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="flex gap-2">
            <Input
              type="password"
              name="passcode"
              placeholder="Passcode"
              required
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
            <Button type="submit" variant="default">
              Submit
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
