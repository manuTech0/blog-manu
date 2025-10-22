"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import { apiFetch } from "@/lib/apiRequest";
import { useAuth } from "@/lib/useAuth";
import z from "zod";
import { Posts } from "@/lib/types";
import { extractGraphQLErrorMessage } from "@/lib/utils";
export default function BlogDetailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuth, user, loading: authLoading } = useAuth();

    const [post, setPost] = useState<Posts | null>(null);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<{ mode?: "edit"; slug?: string }>({});
    const createSchema = z.object({
      title: z.string().min(10).max(120),
      content: z.string().min(30),
      postId: z.string().optional(),
    });

    const form = useForm<z.infer<typeof createSchema>>({
        resolver: zodResolver(createSchema),
        defaultValues: {
            title: "",
            content: "",
            postId: "",
        },
    });

    const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

    // Determine mode (edit/view)
    useEffect(() => {
        setMode({
            mode: searchParams.get("edit") ? "edit" : undefined,
            slug: searchParams.get("slug") || "",
        });
    }, [searchParams]);

    // Fetch post by slug
    useEffect(() => {
        if (!mode?.slug) return;

        (async () => {
            try {
                setLoading(true);
                const query = `
                    query MyQuery($slug: String!) {
                        BySlug(slug: $slug) {
                            content
                            createdAt
                            postId
                            slug
                            status
                            title
                            updateAt
                            userId
                        }
                    }
                `;
                const variables = { slug: mode.slug };
                const data = (await apiFetch(
                    query,
                    {
                      variables
                    })).request;
                if (data?.BySlug) {
                    setPost(data.BySlug);
                    form.reset({
                        title: data.BySlug.title,
                        content: data.BySlug.content,
                        postId: data.BySlug.postId,
                    });
                } else {
                    router.push("/notfound");
                }
            } catch {
                router.push("/notfound");
            } finally {
                setLoading(false);
            }
        })();
    }, [mode]);

    // Set user ID if authenticated
    useEffect(() => {
        if (user) {
            form.reset({
                ...form.getValues(),
            });
        }
    }, [user]);
    useEffect(() => {
        if(post) {
            document.title = "Update " + post?.title
        }
    }, [post])
    const saveHandle = async (values: z.infer<typeof createSchema>) => {
        try {
            console.log("Mode:", JSON.stringify(mode));

            const isEdit = mode?.mode === "edit" && !!mode.slug;

            const mutation = isEdit
            ? `
                mutation posts($postId: String!, $title: String!, $content: String!) {
                    update(postId: $postId, title: $title, content: $content) {
                        content
                        createdAt
                        postId
                        slug
                        status
                        title
                        updateAt
                        userId
                    }
                }
            `
            : `
                mutation posts($title: String!, $content: String!) {
                    create(title: $title, content: $content) {
                        content
                        createdAt
                        postId
                        slug
                        status
                        title
                        updateAt
                        userId
                    }
                }
            `;

            const variables = isEdit
            ? {
                postId: values.postId,
                title: values.title,
                content: values.content
                }
            : {
                title: values.title,
                content: values.content
                };

            const action = apiFetch(mutation, { variables });

            toast.promise(action, {
                loading: "Saving...",
                success: async (data) => {
                    setTimeout(() => {
                        router.push("/account");
                    }, 200);

                    return "Post has been saved successfully";
                },
                error: (err) => {
                    const message = extractGraphQLErrorMessage(err);
                    return message;
                }
            });
        } catch (error) {
            const message =
            typeof error === "object" &&
            error !== null &&
            "message" in error &&
            typeof error.message === "string"
                ? error.message
                : "Unexpected error";
            toast.error(message);
        }
    };


    if (loading || authLoading) {
        return <div className="text-center mt-20 text-muted-foreground">Loading...</div>;
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="px-4 sm:px-6 mt-10 lg:px-32 xl:px-64 py-10 min-h-screen bg-background text-foreground"
            >
                <Form {...form}>
                    <form method="post" onSubmit={form.handleSubmit(saveHandle)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="postId"
                            render={({ field }) => (
                                <FormItem className="hidden">
                                    <FormControl>
                                        <Input type="string" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title {JSON.stringify(form.formState.errors)}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Insert title..." {...field} />
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
                                        <MDEditor
                                            value={field.value}
                                            onChange={(value) => field.onChange(value)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button variant="outline" className="w-full mt-4" type="submit">
                            Save
                        </Button>
                    </form>
                </Form>
            </motion.div>
        </>
    );
}