/**
 * What happened, as far as the notification bell is concerned. The API and the
 * app have to agree on these names, because the bell picks the icon and the
 * screen to open from the type.
 */
export type AdminActivityType =
  | "order"
  | "transaction"
  | "user"
  | "user_deleted"
  | "order_cancelled"
  | "warranty"
  | "message";

/** One line in the admin activity feed, exactly as the API returns it. */
export interface AdminActivity {
  _id: string;
  type: AdminActivityType;
  /** "New order #ORD-A1B2C3" */
  title: string;
  /** "Nihal Ahmed · 2 items · $129.00" */
  detail?: string;
  /** The value the matching list screen can search for. */
  ref?: string;
  createdAt: string;
}

/**
 * One read of the feed: the lines plus the API clock that wrote them.
 *
 * The clock travels with the lines so "3m ago" is measured with the same clock
 * that stamped them, whatever the visitor's system time happens to say.
 */
export interface AdminActivityFeed {
  activities: AdminActivity[];
  /** ISO timestamp of the API at the moment it answered. */
  serverTime: string;
  /**
   * False when the API could not be reached or refused the caller. The bell
   * then keeps the lines it already has instead of blanking itself.
   */
  ok: boolean;
}
