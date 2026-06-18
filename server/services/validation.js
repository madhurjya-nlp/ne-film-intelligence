const { z } = require('zod');

// Shared schemas
const verificationStatusEnum = z.enum(['pending', 'verified', 'needs_review', 'rejected']);
const publicationStatusEnum = z.enum(['draft', 'published', 'archived']);
const formatEnum = z.enum(['online', 'offline', 'hybrid']);

// 1. Source Validator (legacy + ingestion registry)
const sourceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Source name is required'),
  type: z.enum(['website', 'docx', 'xlsx', 'manual', 'system', 'government', 'university', 'festival', 'other']),
  url: z.string().url('Invalid source URL').or(z.literal('')).nullable().optional(),
});

const ingestionSourceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Source name is required'),
  type: z.enum(['website', 'docx', 'xlsx', 'manual', 'system', 'government', 'university', 'festival', 'other']),
  url: z.string().url('Invalid source URL').or(z.literal('')).nullable().optional(),
  country: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  trust_level: z.number().min(0).max(100).optional(),
  active_status: z.union([z.boolean(), z.literal(0), z.literal(1)]).optional(),
  crawl_frequency: z.enum(['daily', 'weekly', 'monthly', 'manual']).optional(),
  parser_type: z.enum(['daad', 'festival', 'university', 'generic']).optional(),
  entity_type: z.enum(['program', 'opportunity', 'event', 'institute']).optional(),
  parser_config: z.record(z.any()).optional(),
  last_run_at: z.string().nullable().optional(),
  last_success_at: z.string().nullable().optional(),
});

// 2. Institute Validator
const instituteSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  country: z.string().min(2, 'Country is required'),
  region: z.string().min(2, 'Region is required'),
  city: z.string().nullable().optional(),
  website_url: z.string().url('Invalid website URL').or(z.literal('')).nullable().optional(),
  summary: z.string().min(5, 'Summary must be at least 5 characters'),
  description: z.string().nullable().optional(),
  verification_status: verificationStatusEnum.default('pending').optional(),
  publication_status: publicationStatusEnum.default('draft').optional(),
  confidence_score: z.number().min(0).max(1).optional(),
  duplicate_of_id: z.string().nullable().optional(),
});

// 3. Program Validator
const programSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  institute_id: z.string().min(1, 'Institute ID is required'),
  category: z.string().min(2, 'Category is required'),
  subcategory: z.string().nullable().optional(),
  country: z.string().min(2, 'Country is required'),
  region: z.string().min(2, 'Region is required'),
  city: z.string().nullable().optional(),
  remote_or_online: z.union([z.literal(0), z.literal(1)]).default(0).optional(),
  format: formatEnum.default('offline').optional(),
  summary: z.string().min(5, 'Summary must be at least 5 characters'),
  description: z.string().nullable().optional(),
  eligibility: z.string().nullable().optional(),
  tuition_or_cost: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  application_url: z.string().url('Invalid application URL').or(z.literal('')).nullable().optional(),
  website_url: z.string().url('Invalid website URL').or(z.literal('')).nullable().optional(),
  source_id: z.string().nullable().optional(),
  verification_status: verificationStatusEnum.default('pending').optional(),
  publication_status: publicationStatusEnum.default('draft').optional(),
  confidence_score: z.number().min(0).max(1).optional(),
  duplicate_of_id: z.string().nullable().optional(),
  tags: z.array(z.string()).optional()
});

// 4. Opportunity Validator
const opportunitySchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  type: z.enum(['scholarship', 'grant', 'fellowship', 'lab', 'residency']),
  subcategory: z.string().nullable().optional(),
  org: z.string().min(2, 'Organization/Host is required'),
  amount: z.string().nullable().optional(),
  country: z.string().min(2, 'Country is required'),
  region: z.string().min(2, 'Region is required'),
  city: z.string().nullable().optional(),
  remote_or_online: z.union([z.literal(0), z.literal(1)]).default(0).optional(),
  format: formatEnum.default('offline').optional(),
  summary: z.string().min(5, 'Summary must be at least 5 characters'),
  description: z.string().nullable().optional(),
  eligibility: z.string().nullable().optional(),
  funding_info: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  application_url: z.string().url('Invalid application URL').or(z.literal('')).nullable().optional(),
  website_url: z.string().url('Invalid website URL').or(z.literal('')).nullable().optional(),
  source_id: z.string().nullable().optional(),
  verification_status: verificationStatusEnum.default('pending').optional(),
  publication_status: publicationStatusEnum.default('draft').optional(),
  confidence_score: z.number().min(0).max(1).optional(),
  duplicate_of_id: z.string().nullable().optional(),
  tags: z.array(z.string()).optional()
});

// 5. Event Validator
const eventSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  type: z.enum(['festival', 'co-production market', 'pitch forum', 'other']),
  subcategory: z.string().nullable().optional(),
  country: z.string().min(2, 'Country is required'),
  region: z.string().min(2, 'Region is required'),
  city: z.string().nullable().optional(),
  remote_or_online: z.union([z.literal(0), z.literal(1)]).default(0).optional(),
  format: formatEnum.default('offline').optional(),
  summary: z.string().min(5, 'Summary must be at least 5 characters'),
  description: z.string().nullable().optional(),
  eligibility: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  application_url: z.string().url('Invalid application URL').or(z.literal('')).nullable().optional(),
  website_url: z.string().url('Invalid website URL').or(z.literal('')).nullable().optional(),
  source_id: z.string().nullable().optional(),
  verification_status: verificationStatusEnum.default('pending').optional(),
  publication_status: publicationStatusEnum.default('draft').optional(),
  confidence_score: z.number().min(0).max(1).optional(),
  duplicate_of_id: z.string().nullable().optional(),
  tags: z.array(z.string()).optional()
});

// 6. Submission Validator
const submissionSchema = z.object({
  id: z.string().optional(),
  submitter_name: z.string().nullable().optional(),
  submitter_email: z.string().email('Invalid email').or(z.literal('')).nullable().optional(),
  data_type: z.enum(['institute', 'program', 'opportunity', 'event']),
  payload: z.record(z.any()),
  notes: z.string().nullable().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending').optional()
});

// 7. Book External Links (Phase 5.1 — affiliate-ready)
const bookLinkTypeEnum = z.enum(['publisher', 'amazon', 'archive', 'open_access', 'goodreads']);

const bookExternalLinkSchema = z.object({
  id: z.string().optional(),
  book_id: z.string().min(1),
  link_type: bookLinkTypeEnum,
  url: z.string().url('Invalid book link URL'),
  label: z.string().nullable().optional(),
  priority: z.number().int().min(0).max(100).default(0).optional(),
});

const bookSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  title: z.string().min(2),
  author: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  ne_relevance: z.string().nullable().optional(),
  legacy_link: z.string().url().or(z.literal('')).nullable().optional(),
  external_links: z.array(bookExternalLinkSchema.omit({ book_id: true })).optional(),
  verification_status: verificationStatusEnum.default('pending').optional(),
  publication_status: publicationStatusEnum.default('draft').optional(),
});

// 8. Review Queue Validator
const reviewQueueSchema = z.object({
  id: z.string().optional(),
  target_type: z.enum(['institute', 'program', 'opportunity', 'event', 'submission']),
  target_id: z.string().min(1, 'Target ID is required'),
  status: verificationStatusEnum,
  reviewer_notes: z.string().nullable().optional(),
  updated_by: z.string().nullable().optional()
});

// Export all schemas
module.exports = {
  sourceSchema,
  ingestionSourceSchema,
  instituteSchema,
  programSchema,
  opportunitySchema,
  eventSchema,
  submissionSchema,
  bookSchema,
  bookExternalLinkSchema,
  bookLinkTypeEnum,
  reviewQueueSchema
};
