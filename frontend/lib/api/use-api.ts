"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";
import * as jobsApi from "./jobs";
import * as customersApi from "./customers";
import * as vehiclesApi from "./vehicles";
import * as intakeApi from "./intake";
import * as inspectionsApi from "./inspections";
import * as invoicesApi from "./invoices";

export function useApi() {
  let authContext: ReturnType<typeof useAuth> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    authContext = useAuth();
  } catch {
    // Fallback if rendered outside ClerkProvider
  }

  const withToken = useCallback(
    async <T>(fn: (token?: string) => Promise<T>): Promise<T> => {
      let token: string | undefined;
      try {
        if (authContext?.getToken) {
          const raw = await authContext.getToken();
          if (raw && typeof raw === "string" && raw.trim().length > 0) {
            token = raw.trim();
          }
        }
      } catch {
        // Fallback to dev mode (FastAPI auto-injects dev workshop if no Bearer token in dev mode)
      }
      return fn(token);
    },
    [authContext]
  );

  return {
    jobs: {
      list: (status?: string) => withToken((t) => jobsApi.fetchJobs(status, t)),
      get: (id: string) => withToken((t) => jobsApi.fetchJob(id, t)),
      create: (data: jobsApi.CreateJobInput) => withToken((t) => jobsApi.createJob(data, t)),
      updateStatus: (id: string, status: string) => withToken((t) => jobsApi.updateJobStatus(id, status, t)),
      toggleItem: (jobId: string, itemId: string) => withToken((t) => jobsApi.toggleJobItem(jobId, itemId, t)),
      sendQuote: (jobId: string) => withToken((t) => jobsApi.sendJobQuote(jobId, t)),
    },
    customers: {
      list: (search?: string) => withToken((t) => customersApi.fetchCustomers(search, t)),
      get: (id: string) => withToken((t) => customersApi.fetchCustomer(id, t)),
      create: (data: customersApi.CustomerCreateInput) => withToken((t) => customersApi.createCustomer(data, t)),
    },
    vehicles: {
      list: () => withToken((t) => vehiclesApi.fetchVehicles(t)),
      get: (id: string) => withToken((t) => vehiclesApi.fetchVehicle(id, t)),
      create: (data: vehiclesApi.VehicleCreateInput) => withToken((t) => vehiclesApi.createVehicle(data, t)),
      lookupPlate: (plate: string) => withToken((t) => intakeApi.lookupVehicleByPlate(plate, t)),
    },
    inspections: {
      list: () => withToken((t) => inspectionsApi.fetchInspections(t)),
      get: (id: string) => withToken((t) => inspectionsApi.fetchInspection(id, t)),
      create: (data: inspectionsApi.CreateInspectionInput) => withToken((t) => inspectionsApi.createInspection(data, t)),
    },
    invoices: {
      list: () => withToken((t) => invoicesApi.fetchInvoices(t)),
      get: (id: string) => withToken((t) => invoicesApi.fetchInvoice(id, t)),
      create: (data: invoicesApi.CreateInvoiceInput) => withToken((t) => invoicesApi.createInvoice(data, t)),
      recordPayment: (id: string, data: invoicesApi.RecordPaymentInput) => withToken((t) => invoicesApi.recordPayment(id, data, t)),
    },
  };
}
