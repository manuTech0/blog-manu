"use client"
import * as React from "react"
import { UsersAdminTable } from "@/components/usersAdminTable";
import axios from "axios"
import { toast } from "sonner";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogHeader, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useAdminState } from "@/components/adminStateProvider";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input";
import dynamic from "next/dynamic";
import Cookies from "js-cookie"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { ApiResponse, ErrorZod, Post, User } from "@/lib/types";
import slugify from "slugify";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ClientZodPost, ClientZodUser  } from "@/lib/allZodSchema";
import { zodErrorValidateToStr } from "@/lib/utils";


export default function Users() {
  const [openDialog, setOpenDialog] = React.useState(false)
  const [loadingData, setLoadingData] = React.useState(false)
  const [users, setUsers] = React.useState<User[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setPost] = React.useState<Post[]>([])
  const {formMode, setFormMode} = useAdminState()

  const token = Cookies.get("auth_token")

  React.useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get("/api/protected/user", {
          headers: {
            "Content-Type": "Application/json",
            "Authorization": `Bearer ${token}` 
          }
        })
        const data: ApiResponse = response.data
        if (data.error || !data.data) {
          toast.error("Uh oh! Something went wrong.", {
            description: data.message
          })
        } else {
          setUsers(data.data as User[])
        }
      } catch (error) {
        toast.error("Failed to fetch posts. \n" + error)
      } finally {
        setLoadingData(false)
      }
    }
    fetchData()
  }, [])
  React.useEffect(() => {
    if((formMode.mode == "add" || formMode.mode == "edit") && formMode.dialog) {
      setOpenDialog(true)
    }
  }, [formMode])

  const zodUser = new ClientZodUser()
  const zodPost = new ClientZodPost()

  const [usersSchema, postSchema] = [zodUser.createUserSchema, zodPost.createSchema]

  const usersSchemaFull = usersSchema.extend({ type: z.literal("user") });
  const postSchemaFull = postSchema.extend({ type: z.literal("post") });

  const formSchema = z.discriminatedUnion("type", [
    usersSchemaFull,
    postSchemaFull,
  ]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: formMode.dataType,
      username: (formMode.mode == "edit") ? (formMode.data as User).username : "",
      email: (formMode.mode == "edit") ? (formMode.data as User).email : "",
      password: "",
      role: (formMode.mode == "edit") ? (formMode.data as User).role : undefined,
      isVerified: (formMode.mode == "edit") ? (formMode.data as User).isVerified : undefined,
      postId: (formMode.mode == "edit") ? (formMode.data as Post).postId : undefined,
    }
  })
  React.useEffect(() => {
    if (formMode.mode === "edit") {
      if(formMode.dataType == "user") {
        form.reset({
          type: formMode.dataType,
          username: (formMode.data as User).username,
          email: (formMode.data as User).email,
          password: "",
          userId: (formMode.data as User).userId,
          role: (formMode.data as User).role,
          isVerified: (formMode.data as User).isVerified
        })
      } else {
        form.reset({
          type: formMode.dataType,
          title: (formMode.data as Post).title,
          content: (formMode.data as Post).content,
          userId: (formMode.data as Post).userId,
          postId: (formMode.data as Post).postId,
        });
      }
    } else if (formMode.mode === "add") {
      if(formMode.dataType == "user") {
        form.reset({
          type: formMode.dataType,
          username: "",
          email: "",
          password: "",
          role: "USER",
          isVerified: false
        })
      } else {
        form.reset({
          type: formMode.dataType,
          title: "",
          content: "",
          postId: undefined,
        });
      }
    }
  }, [formMode, form]);

  const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

  function editSubmit(values: z.infer<typeof formSchema>) {
    if(formMode.dataType == "user" && "password" in values) {
      const dataPromise = axios.put(`/api/protected/user/admin/${values.userId}/`, {
          username: values.username,
          email: values.email,
          password: values.password,
          role: values.role,
          isVerified: values.isVerified,
      }, {
        headers: {
          "Content-Type": "Application/json",
          "Authorization": `Bearer ${token}` 
        },
      })
      toast.promise(dataPromise, {
        loading: 'Loading...',
        success: (response) => {
          const data: ApiResponse = response.data
          if(data.error || !data.data) {
            if(data.data as ErrorZod[]) return zodErrorValidateToStr(data.data as ErrorZod[])
            return "Uh oh! Something went wrong: " + data.message
          }
          setUsers(data.data as User[])
          setOpenDialog(false)
          return "Post has been updated"
        },
        error: (err) => (err?.data?.data as ErrorZod[]) ? zodErrorValidateToStr(err?.data?.message as ErrorZod[]) : err?.data?.message || err?.message || "Unknown error"
      });
    } else if("title" in values) {
      const slug = slugify(values.title, {
        lower: true,
        strict: true,
        locale:  "id",
        trim: true,
      })
      const dataPromise = axios.put(`/api/protected/post/${values.postId}/`, {
        title: values.title,
        content: values.content,
        slug: slug
      }, {
        headers: {
          "Content-Type": "Application/json",
          "Authorization": `Bearer ${token}` 
        },
      })
      toast.promise(dataPromise, {
        loading: 'Loading...',
        success: (response) => {
          const data: ApiResponse = response.data
          if(data.error || !data.data) {
            if(data.data as ErrorZod[]) return zodErrorValidateToStr(data.data as ErrorZod[])
            return "Uh oh! Something went wrong: " + data.message
          }
          setPost(data.data as Post[])
          setOpenDialog(false)
          return "Post has been updated"
        },
        error: (err) => (err?.data?.data as ErrorZod[]) ? zodErrorValidateToStr(err?.data?.message as ErrorZod[]) : err?.data?.message || err?.message || "Unknown error"
      });
    }
  }
  function addSubmit(values: z.infer<typeof formSchema>){
    if(formMode.dataType == "user" && "password" in values) {
      const dataPromise = axios.post("/api/protected/user/admin/0/", {
          username: values.username,
          email: values.email,
          password: values.password,
          role: values.role,
          isVerified: values.isVerified,
      }, {
        headers: {
          "Content-Type": "Application/json",
          "Authorization": `Bearer ${token}` 
        },
      })
      toast.promise(dataPromise, {
        loading: 'Loading...',
        success: (response) => {
          const data: ApiResponse = response.data
          if(data.error || !data.data) {
            if(data.data as ErrorZod[]) return zodErrorValidateToStr(data.data as ErrorZod[])
            return "Uh oh! Something went wrong: " + JSON.stringify(data.data)
          }
          setUsers(data.data as User[])
          setOpenDialog(false)
          form.reset()
          return `Post has been added`;
        },
        error: (err) => (err?.data?.data as ErrorZod[]) ? zodErrorValidateToStr(err?.data?.message as ErrorZod[]) : err?.data?.message || err?.message || "Unknown error"
      });
    } else if("title" in values) {
      const dataPromise = axios.post("/api/protected/post/0/", {
        title: values.title,
        content: values.content,
        userId: values.userId
      }, {
        headers: {
          "Content-Type": "Application/json",
          "Authorization": `Bearer ${token}` 
        },
      })
      toast.promise(dataPromise, {
        loading: 'Loading...',
        success: (response) => {
          const data: ApiResponse = response.data
          if(data.error || !data.data) {
            if(data.data as ErrorZod[]) return zodErrorValidateToStr(data.data as ErrorZod[])
            return "Uh oh! Something went wrong: " + JSON.stringify(data.data)
          }
          setPost(data.data as Post[])
          setOpenDialog(false)
          form.reset()
          return `Post has been added`;
        },
        error: (err) => (err?.data?.data as ErrorZod[]) ? zodErrorValidateToStr(err?.data?.message as ErrorZod[]) : err?.data?.message || err?.message || "Unknown error"
      });
    }
  }

  return (
    <div className="p-4 w-full">
      <h1 className="text-2xl font-bold mb-4">Manage Posts</h1>
      <div className="w-full">
        <UsersAdminTable data={users} triggerDialogForm={setFormMode} isLoading={loadingData} />
        <Dialog open={openDialog} onOpenChange={setOpenDialog || false}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{(formMode.dataType == "post") ? 
                (formMode.mode == "add" ? "Add new post data" : "Update post data") :
                (formMode.mode == "add" ? "Add new user" : "Update user data")  
              }</DialogTitle>
              <DialogDescription>{(formMode.dataType == "post") ? 
                (formMode.mode == "add" ? "Add new post data" : "Update post data") :
                (formMode.mode == "add" ? "Add new user" : "Update user data")  
              }</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(formMode.mode == "edit" ? editSubmit : addSubmit)}>
                {(formMode.dataType == "user") ? (
                  <div className="overflow">
                    
                    <FormField
                      control={form.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input  {...field} type="hidden" value={field.value ?? 0} onChange={value => field.onChange(Number(value))} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>username</FormLabel>
                          <FormControl>
                            <Input placeholder="Username..." {...field} />
                          </FormControl>
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
                            <Input placeholder="Email..." {...field} type="email"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input placeholder="Password..." {...field} type="password"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <FormControl>
                            <Select onValueChange={value => field.onChange(value)} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    {field.value ?? "Select a Role"}
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="USER">User</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isVerified"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>OTP Verified</FormLabel>
                          <FormControl>
                            <RadioGroup 
                              onValueChange={(val) => field.onChange(val === "true")}
                              value={String(field.value)}
                            >
                              <div className="flex gap-3">
                                <RadioGroupItem value="true" id="one" />
                                <Label htmlFor="one">OTP Verified</Label>
                              </div>
                              <div className="flex gap-3">
                                <RadioGroupItem value="false" id="two" />
                                <Label htmlFor="two">Not Verified</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  <div>
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input  {...field} type="hidden" value="post" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="postId"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input  {...field} type="hidden"  value={field.value || 0} onChange={value => field.onChange(Number(value))}/>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Title..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            <MDEditor {...field}  onChange={(value) => field.onChange(value ?? "")}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {formMode.mode == "add" ? (
                      <FormField
                        control={form.control}
                        name="userId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <Select onValueChange={value => field.onChange(Number(value))} defaultValue={String(field.value)}>
                              <FormControl>
                                <SelectTrigger>
                                  {users.find(u => u.userId === field.value)?.username ?? "Select a user"}
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {users.map(item => (
                                  <SelectItem key={item.userId} value={String(item.userId)}>{item.username}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : ""}
                  </div>
                )}
                <DialogFooter className="mt-4">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose> 
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
          
      </div>
    </div>
  )
}
