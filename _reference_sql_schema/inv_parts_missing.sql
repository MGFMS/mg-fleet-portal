SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[inv_parts_missing](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[part_id] [int] NULL,
	[part_name] [nvarchar](50) NULL,
	[qty] [decimal](18, 0) NULL,
	[quotation_id] [int] NULL,
	[status] [nvarchar](20) NULL,
	[added_by] [nvarchar](50) NULL,
	[date_added] [datetime] NULL,
	[purchase_id] [int] NULL,
	[updated_by] [nvarchar](50) NULL,
	[date_updated] [datetime] NULL,
	[plate_number] [nvarchar](20) NULL,
	[quotation_code] [nvarchar](50) NULL,
	[quotation_details_id] [int] NULL
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[inv_parts_missing] ADD  CONSTRAINT [PK_inv_parts_missing] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
