export type CustomerType = 'INDIVIDUAL' | 'BUSINESS';

export type CaseStatus =
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'MORE_INFO_NEEDED'
  | 'QUOTATION_SENT'
  | 'QUOTATION_ACCEPTED'
  | 'QUOTATION_DECLINED'
  | 'REQUEST_DECLINED'
  | 'CLOSED';

export type ProjectStatus =
  | 'NEW'
  | 'PLANNING'
  | 'QUOTED'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Product {
  id: string;
  name: string;
  category: string;
  categoryId?: string | null;
  description: string;
  defaultUnit: string;
  availableUnits: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string | null;
  sortOrder: number;
}

export interface CaseProduct {
  id: string;
  caseId: string;
  productId?: string | null;
  productName: string;
  productDescription?: string | null;
  customRequirements?: string | null;
  product?: Product | null;
}

export interface CaseMessage {
  id: string;
  caseId: string;
  senderType: 'CUSTOMER' | 'STAFF';
  staffUserId?: string | null;
  senderName: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  staffUser?: {
    id: string;
    name: string;
    role: string;
  } | null;
  case?: {
    id: string;
    caseNumber: string;
    customerName: string;
    customerEmail: string;
    status: CaseStatus;
  };
}

export interface QuotationItem {
  id: string;
  quotationId: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
  sortOrder: number;
}

export interface QuotationDecision {
  id: string;
  quotationId: string;
  caseId: string;
  version: number;
  decision: 'ACCEPTED' | 'DECLINED';
  decisionReason?: string | null;
  decidedAt: string;
  customerEmail: string;
}

export interface Quotation {
  id: string;
  caseId: string;
  quotationNumber: string;
  version: number;
  status: 'DRAFT' | 'ISSUED' | 'SUPERSEDED';
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  validityDate: string;
  termsAndConditions: string;
  notes?: string | null;
  createdByStaffId: string;
  createdAt: string;
  updatedAt: string;
  items: QuotationItem[];
  decisions?: QuotationDecision[];
  case?: {
    id: string;
    caseNumber: string;
    customerName: string;
  };
  createdBy?: {
    id: string;
    name: string;
  };
}

export interface CaseStatusHistory {
  id: string;
  caseId: string;
  fromStatus?: string | null;
  toStatus: string;
  changedByStaffId?: string | null;
  notes?: string | null;
  createdAt: string;
  changedBy?: {
    id: string;
    name: string;
  } | null;
}

export interface Case {
  id: string;
  caseNumber: string;
  customerId?: string | null;
  customerType: CustomerType;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: CaseStatus;
  statusDescription?: string;
  declineReason?: string | null;
  closeReason?: string | null;
  isQuoteComparison: boolean;
  existingQuoteDetails?: {
    existingProduct?: string;
    quotedQuantity?: string;
    currentQuotedPrice?: string;
    terms?: string;
    additionalDescription?: string;
  } | null;
  quantity: number;
  unit: string;
  deliveryAddress: string;
  desiredDeliveryDate?: string | null;
  deliveryRequirements?: string | null;
  technicalRequirements?: string | null;
  comments?: string | null;
  privacyAccepted: boolean;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer | null;
  caseProducts?: CaseProduct[];
  messages?: CaseMessage[];
  quotations?: Quotation[];
  statusHistory?: CaseStatusHistory[];
  _count?: {
    messages: number;
    quotations: number;
  };
}

export interface Customer {
  id: string;
  name: string;
  customerType: CustomerType;
  companyName?: string | null;
  email: string;
  phone: string;
  address?: string | null;
  createdAt: string;
  updatedAt?: string;
  casesCount?: number;
  projectsCount?: number;
  totalProjectValue?: number;
  cases?: Case[];
  projects?: Project[];
}

export interface ProjectMaterial {
  id: string;
  projectId: string;
  productId?: string | null;
  productName: string;
  description?: string | null;
  quantity: number;
  unit: string;
  deliveryAddress?: string | null;
  deliveryDate?: string | null;
  technicalRequirements?: string | null;
  product?: Product | null;
}

export interface ProjectStatusHistory {
  id: string;
  projectId: string;
  fromStatus?: string | null;
  toStatus: string;
  changedByStaffId?: string | null;
  notes?: string | null;
  progress?: number | null;
  createdAt: string;
  changedBy?: {
    id: string;
    name: string;
  } | null;
}

export interface Project {
  id: string;
  projectId: string; // e.g. BP-PRJ-2026-0001
  name: string;
  description?: string | null;
  customerId: string;
  caseId?: string | null;
  quotationId?: string | null;
  status: ProjectStatus;
  progress: number; // 0 to 100
  location: string;
  projectValue: number;
  approvedValue?: number | null;
  vatAmount?: number | null;
  currency: string;
  startDate?: string | null;
  expectedDeliveryDate?: string | null;
  actualCompletionDate?: string | null;
  assignedStaffId?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  case?: Case;
  quotation?: Quotation;
  assignedStaff?: {
    id: string;
    name: string;
    email: string;
  } | null;
  materials?: ProjectMaterial[];
  statusHistory?: ProjectStatusHistory[];
  _count?: {
    materials: number;
  };
}

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: 'EMPLOYEE' | 'ADMINISTRATOR';
  permissions?: string[];
  isActive: boolean;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    quotations: number;
    messages: number;
    assignedProjects?: number;
  };
}

export interface SystemPermission {
  id: string;
  label: string;
  category: string;
  description: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  staffUserId?: string | null;
  description?: string | null;
  details?: string | null;
  createdAt: string;
  staffUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export interface ApplicationSettings {
  id: string;
  companyName: string;
  companyLogoUrl?: string | null;
  orgNumber: string;
  vatNumber: string;
  address: string;
  supportEmail: string;
  supportPhone: string;
  defaultVatRate: number;
  currency?: string;
  defaultQuotationTerms: string;
  measurementUnits?: string;
  dataRetentionDays?: number;
}

export interface NotificationEmailLog {
  id: string;
  toEmail: string;
  subject: string;
  template: string;
  bodyText: string;
  caseNumber?: string | null;
  status: string;
  createdAt: string;
}

export interface DashboardMetricsAdmin {
  totalCases: number;
  newCases: number;
  underReviewCases: number;
  moreInfoNeededCases: number;
  quotationSentCases: number;
  acceptedQuotationCases: number;
  activeProjects: number;
  completedProjects: number;
}

export interface DashboardMetricsEmployee {
  openCases: number;
  pendingReview: number;
  quotesAwaitingResponse: number;
  activeProjects: number;
  unreadMessagesCount: number;
}
