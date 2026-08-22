"use client";

import RegionalTablePage from "@/components/admin/RegionalTablePage";

/**
 * Regional Admin Customers.
 *
 * RA-07: reads GET /regional/customers, where the region is resolved from the
 * caller's staff record - so the page never has to know, choose, or send it.
 */
const DistributorTable = () => {
  return <RegionalTablePage regionalPortal />;
};

export default DistributorTable;
