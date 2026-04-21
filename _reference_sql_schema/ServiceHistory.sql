SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ServiceHistory](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[plate_no] [nvarchar](20) NULL,
	[service] [nvarchar](max) NULL,
	[service_notes] [nvarchar](max) NULL,
	[added_by] [nvarchar](50) NULL,
	[datetime_added] [datetime] NULL,
	[source] [nvarchar](20) NULL,
	[service_receipt_id] [int] NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE [dbo].[ServiceHistory] ADD  CONSTRAINT [PK_ServiceHistory] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
