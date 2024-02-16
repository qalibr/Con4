import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  addFriend,
  updateFriend,
} from "@/confourComponents/friendlist/friends-db.tsx";
import { Friend } from "@/confourComponents/friendlist/types.tsx";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  status: z.enum(["online", "offline", "away", "dnd"]),
  email: z.string().email(),
});

interface FriendFormProps {
  initialData?: Friend;
  onSubmitSuccess?: (data: Friend) => void;
}

export function FriendForm({ initialData, onSubmitSuccess }: FriendFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      status: "offline",
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    let result;
    if (initialData?.id) {
      result = await updateFriend(initialData.id, values);
    } else {
      result = await addFriend(values);
    }

    if (result.error) {
      console.error("Submission error", result.error);
    } else {
      if (onSubmitSuccess && result.data) {
        onSubmitSuccess(result.data[0]);
      }
    }
  };

  // Form to add friends. TODO: make it into something that resembles an actual add friend tool
  // Bug: Form is not cleared upon submission
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>Enter your email address.</FormDescription>
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
