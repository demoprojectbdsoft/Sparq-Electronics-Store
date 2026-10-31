import {
  Bell,
  CircleCheck,
  CircleX,
  Inbox,
  Navigation,
  Package,
  PackageCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PersonalNotification, PersonalNotificationType } from "@/types";

/**
 * How a customer/rider notification looks and where it goes.
 *
 * Shared by the header bell and the notifications page, so a line opens the
 * same screen from either place.
 */

/** One icon per kind of line, so a glance tells the story. */
export const PERSONAL_NOTIFICATION_ICONS: Record<PersonalNotificationType, LucideIcon> = {
  order_placed: ShoppingBag,
  order_confirmed: CircleCheck,
  order_processing: Package,
  order_shipped: Truck,
  order_delivered: PackageCheck,
  order_cancelled: CircleX,
  delivery_assigned: Inbox,
  delivery_update: Navigation,
  delivery_declined: CircleX,
};

/**
 * Where one line sends its owner.
 *
 * A rider has one screen per kind of work: a request is answered, a delivery is
 * opened. A customer's delivery update carries the order id, so it opens the
 * live tracking page — the only screen with the rider's position and the code
 * to read at the door. Everything else goes to the order list.
 */
export function personalNotificationLink(
  notification: Pick<PersonalNotification, "type" | "ref">,
  role: "customer" | "rider"
): string {
  const ref = encodeURIComponent(notification.ref || "");

  if (role === "customer") {
    if (notification.type === "delivery_update" && ref) return `/track-order/${ref}`;
    return `/dashboard/customer/orders${ref ? `?search=${ref}` : ""}`;
  }

  if (notification.type === "delivery_assigned") return "/dashboard/rider/requests";
  return `/dashboard/rider/deliveries${ref ? `?search=${ref}` : ""}`;
}

/** What an empty feed says, which depends on what the account can be told. */
export const PERSONAL_NOTIFICATION_EMPTY: Record<"customer" | "rider", string> = {
  customer: "Order and delivery updates show up here.",
  rider: "Delivery requests and delivery updates show up here.",
};

/** The bell's icon, used whenever a line carries a type this build predates. */
export const PERSONAL_NOTIFICATION_FALLBACK_ICON = Bell;
