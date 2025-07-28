"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, MoreHorizontal, RefreshCcwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import axios from "axios"
import { AlertDialog, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog"
import { AlertDialogAction, AlertDialogCancel, AlertDialogDescription, AlertDialogTrigger } from "@radix-ui/react-alert-dialog"
import { useRouter } from "next/navigation"
import type { TableMode, TriggerDialogForm, User } from "../lib/types"
import { Skeleton } from "./ui/skeleton"

export function UsersAdminTable({
  data, triggerDialogForm, isLoading, tableMode = "data"
}: { 
  data: User[],
  triggerDialogForm: React.Dispatch<React.SetStateAction<TriggerDialogForm>>,
  isLoading: boolean,
  tableMode?: TableMode
}) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [token, setToken] = React.useState("")
  const router = useRouter()

  React.useEffect(() => {
    const tokenCookies = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1]

    setToken(tokenCookies || "token")
  }, [])

  const columns: ColumnDef<User>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "userId",
      header: () => <div className="text-center">ID</div>,
      cell: ({ row }) => {
        return <div className="text-center">{row.getValue("userId")}</div>
      }
    },
    {
      accessorKey: "username",
      header: () => <div className="text-center">Username</div>,
      cell: ({ row }) => {
        return <div className="text-left">{row.getValue("username")}</div>
      }
    },
    {
      accessorKey: "email",
      header: () => <div className="text-center">Email</div>,
      cell: ({ row }) => {
        return <div className="text-left">{row.getValue("email")}</div>
      }
    },
    {
      accessorKey: "role",
      header: () => <div className="text-center">Role</div>,
      cell: ({ row }) => {
        return <div className="text-center lowercase">{row.getValue("role")}</div>
      }
    },
    {
      accessorKey: "isVerified",
      header: () => <div className="text-center">Verified</div>,
      cell: ({ row }) => {
        return <div className="text-center lowercase">{row.getValue("role") ? "Yes" : "No"}</div>
      }
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original
  
        return (
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(user.email)}
                >
                  Copy email
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {
                  (tableMode == "data") ? (
                    <div>
                      <DropdownMenuItem
                        onClick={() => triggerDialogForm({
                          mode: "edit",
                          dataType: "user",
                          dialog: true,
                          data: user
                        })}
                      >
                        Edit
                      </DropdownMenuItem>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem>
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                    </div>
                  ) : (
                    <div>
                      <DropdownMenuItem
                        onClick={() => {
                          toast.promise(axios.put("/api/protected/user/admin/permanent/recovery", [user.userId], {
                            headers: {
                              "Content-Type": "Application/json",
                              "Authorization": "Bearer "+token
                            }
                          }).then(() => router.refresh()), {
                            loading: 'Loading...',
                            success: () => {
                              return `${user.userId} has been precovery`;
                            },
                            error: "Error delete data"
                          })
                        }}
                      >
                        Recovery
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          toast.promise(axios.put("/api/protected/user/admin/permanent/delete", [user.userId], {
                            headers: {
                              "Content-Type": "Application/json",
                              "Authorization": "Bearer "+token
                            }
                          }).then(() => router.refresh()), {
                            loading: 'Loading...',
                            success: () => {
                              return `${user.userId} has been permanent deleted`;
                            },
                            error: "Error delete data"
                          })
                        }}
                      >
                        Permanent Delete
                      </DropdownMenuItem>
                    </div>
                  )
                }
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your
                  account and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                  toast.promise(axios.delete("/api/protected/user/admin/" + user.userId, {headers: {
                    "Content-Type": "Application/json",
                    "Authorization": "Bearer "+token
                  }}).then(() => router.refresh()), {
                    loading: 'Loading...',
                    success: () => {
                      return `${user.userId} has been deleted`;
                    },
                    error: "Error delete data"
                  })
                }}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      },
    },
  ]


  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="flex justify-content-between py-4">
        <Input
          placeholder="Filter username..."
          value={(table.getColumn("username")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("username")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Button variant="outline" onClick={() => router.refresh()}><RefreshCcwIcon /></Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {(!isLoading && table.getRowModel().rows?.length) ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : ((!table.getRowModel().rows?.length) ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              Array.from({ length: 1 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell colSpan={columns.length}>
                    <Skeleton className="w-full h-5 p-2">Loading..</Skeleton>
                  </TableCell>
                </TableRow>
              ))
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
