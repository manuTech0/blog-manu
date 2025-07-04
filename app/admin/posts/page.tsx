"use client"
import * as React from "react"
import { PostAdminTable } from "@/components/postAdminTable";
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
import slugify from "slugify";
import Cookies from "js-cookie"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { ApiPost, ApiUsers, getFormSchema, Post, User } from "@/lib/types";
import { logger } from "@/lib/logger";


export default function Posts() {
  const [post, setPost] = React.useState<Post[]>([])
  const [openDialog, setOpenDialog] = React.useState(false)
  const [loadingData, setLoadingData] = React.useState(false)
  const [users, setUsers] = React.useState<User[]>([])
  const {formMode, setFormMode} = useAdminState()

  const token = Cookies.get("auth_token")

  React.useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get("/api/post", {
          headers: {
            "Content-Type": "Application/json"
          }
        })
        const data: ApiPost = response.data
        if (data.error || !data.data) {
          toast.error("Uh oh! Something went wrong.", {
            description: data.message
          })
        } else {
          setPost(data.data)
        }
      } catch (error) {
        logger.error(error)
        toast.error("Failed to fetch posts.")
      } finally {
        setLoadingData(false)
      }
    }
    fetchData()
  }, [])
  React.useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get("/api/protected/user", {
          headers: {
            "Content-Type": "Application/json",
            "Authorization": `Bearer ${token}` 
          }
        })
        const data: ApiUsers = response.data
        if (data.error || !data.data) {
          toast.error("Uh oh! Something went wrong.", {
            description: data.message
          })
        } else {
          setUsers(data.data)
        }
      } catch (error) {
        logger.error(error)
        toast.error("Failed to fetch posts.")
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

  let formSchema: z.ZodType = getFormSchema(formMode.dataType)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: (formMode.mode == "edit") ? (formMode.data as Post).title : "",
      content: (formMode.mode == "edit") ? (formMode.data as Post).content : "",
      postId: (formMode.mode == "edit") ? (formMode.data as Post).postId : undefined,
    }
  })
  React.useEffect(() => {
    if (formMode.mode === "edit") {
      if(formMode.dataType == "user") {
        form.reset({
          username: (formMode.data as User).username,
          email: (formMode.data as User).username,
          password: "",
          role: (formMode.data as User).role,
          isVerified: (formMode.data as User).isVerified
        })
      } else {
        form.reset({
          title: (formMode.data as Post).title,
          content: (formMode.data as Post).content,
          postId: (formMode.data as Post).postId,
        });
      }
    } else if (formMode.mode === "add") {
      if(formMode.dataType == "user") {
        form.reset({
          username: "",
          email: "",
          password: "",
          role: "USER",
          isVerified: false
        })
      } else {
        form.reset({
          title: "",
          content: "",
          postId: undefined,
        });
      }
    }
  }, [formMode, form]);

  const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

  function editSubmit(values: z.infer<typeof formSchema>) {
    if(formMode.dataType == "user") {
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
          const data: ApiUsers = response.data
          if(data.error || !data.data) {
            return "Uh oh! Something went wrong: " + data.message
          }
          setUsers(data.data)
          setOpenDialog(false)
          return "Post has been updated"
        },
        error: 'Error',
      });
    } else {
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
          const data: ApiPost = response.data
          if(data.error || !data.data) {
            return "Uh oh! Something went wrong: " + data.message
          }
          setPost(data.data)
          setOpenDialog(false)
          return "Post has been updated"
        },
        error: 'Error',
      });
    }
  }
  function addSubmit(values: z.infer<typeof formSchema>){
    if(formMode.dataType == "user") {
      const dataPromise = axios.post("/api/protected/admin/0/", {
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
          const data: ApiUsers = response.data
          if(data.error || !data.data) {
            return "Uh oh! Something went wrong: " + JSON.stringify(data.data)
          }
          setUsers(data.data)
          setOpenDialog(false)
          form.reset()
          return `Post has been added`;
        },
        error: 'Error',
      });
    } else {
      const dataPromise = axios.post("/api/protected/post/admin/0/", {
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
          const data: ApiPost = response.data
          if(data.error || !data.data) {
            return "Uh oh! Something went wrong: " + JSON.stringify(data.data)
          }
          setPost(data.data)
          setOpenDialog(false)
          form.reset()
          return `Post has been added`;
        },
        error: 'Error',
      });
    }
  }

  return (
    <div className="p-4 w-full">
      <h1 className="text-2xl font-bold mb-4">Manage Posts</h1>
      <div className="w-full">
        <PostAdminTable data={post} triggerDialogForm={setFormMode} isLoading={loadingData} />
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
                {(formMode.dataType == "post") ? (
                  <div>
                    <FormField
                      control={form.control}
                      name="postId"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input  {...field} type="hidden" />
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
                                  Select a username to display
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {users.map(item => (
                                  <SelectItem value={String(item.userId)}>{item.username}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : ""}
                  </div>
                ) : (
                  <div className="overflow">
                    <FormField
                      control={form.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input  {...field} type="hidden" />
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
                                    Select a role to display
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
                            {/* <Input {...field} type="radio"checke/> */}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
