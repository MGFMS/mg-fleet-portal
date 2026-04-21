--create table [#tempAppointments] (
--[Id] [int] identity,
--[customer_id] [int] NULL,
--[customer_name] [nvarchar] (200) NULL,
--[contact_number] [nvarchar] (30) NULL,
--[appointment_date] [datetime] NULL,
--[appointment_time] [smallint] NULL,
--[vehicle_id] [int] NULL,
--[plate_number] [nvarchar] (20) NULL,
--[service_id] [nvarchar] (max) NULL,
--[initial_unit_concern] [nvarchar] (max) NULL,
--[other_concern] [nvarchar] (max) NULL,
--[problem_occur] [nvarchar] (max) NULL,
--[other_problem_occur] [nvarchar] (max) NULL,
--[last_work_done] [nvarchar] (max) NULL,
--[appointment_status] [nvarchar] (20) NULL,
--[added_by] [nvarchar] (20) NULL,
--[date_added] [datetime] NULL,
--[updated_by] [nvarchar] (20) NULL,
--[date_updated] [datetime] NULL,
--[branch_id] [smallint] NULL,
--[booking_type] [nvarchar] (50) NULL,
--[customer_type] [nvarchar] (50) NULL,
--[cancellation_reason] [nvarchar] (max) NULL,
--[assigned_mechanic_id] [smallint] NULL,
--[person_incharge_id] [smallint] NULL,
--[service_status] [nvarchar] (50) NULL,
--[time_in] [datetime] NULL,
--[time_out] [datetime] NULL,
--[datetime_completion] [datetime] NULL,
--[estimated_time_completion] [datetime] NULL);



set identity_insert [#tempAppointments] on;


insert [#tempAppointments] ([Id],[customer_id],[customer_name],[contact_number],[appointment_date],[appointment_time],[vehicle_id],[plate_number],[service_id],[initial_unit_concern],[other_concern],[problem_occur],[other_problem_occur],[last_work_done],[appointment_status],[added_by],[date_added],[updated_by],[date_updated],[branch_id],[booking_type],[customer_type],[cancellation_reason],[assigned_mechanic_id],[person_incharge_id],[service_status],[time_in],[time_out],[datetime_completion],[estimated_time_completion])
select 1,1,N'GIAN CRUZ',N'09182229800','2025-10-01 00:00:00.000',13,1,N'NEY667',N'1',N'BLACK SMOKE',N'NONE',N'DURING COLD START',NULL,N'PMS',N'CONFIRMED',N'jggozum (MG Bacoor)','2025-10-01 13:34:02.837',N'jggozum (MG Bacoor)','2025-10-01 18:48:11.723',1,N'SCHEDULED',N'OLD',NULL,14,4,N'ARRIVED','2025-10-01 14:06:00.000',NULL,NULL,NULL UNION ALL
select 2,2,N'JUN KING MANZANO',N'09112372231','2025-09-29 00:00:00.000',10,2,N'POL2912',N'25',N'BLACK SMOKE',NULL,N'DURING COLD START',NULL,NULL,N'CONFIRMED',N'jggozum (MG Bacoor)','2025-10-01 14:08:05.317',N'jggozum (MG Bacoor)','2025-10-01 18:47:00.623',1,N'WALK-IN',N'NEW',NULL,13,11,N'PENDING','2025-10-01 14:08:00.000',NULL,NULL,'2025-10-01 00:00:00.000' UNION ALL
select 3,3,N'JENN VARGAS',N'09187212314','2025-09-30 00:00:00.000',14,3,N'XAY0099',N'61',N'CLUTCH SLIDING',NULL,N'DURING SLOW DOWN',NULL,NULL,N'CONFIRMED',N'jggozum (MG Bacoor)','2025-10-01 14:12:41.507',N'jggozum (MG Bacoor)','2025-10-01 14:14:05.083',1,N'WALK-IN',N'OLD',NULL,13,11,N'PENDING','2025-10-01 14:13:00.000',NULL,NULL,NULL UNION ALL
select 4,4,N'JUNICA ANN DOMINGO',N'09227110909','2025-10-01 00:00:00.000',15,4,N'TIN2211',N'1',NULL,NULL,NULL,NULL,NULL,N'CONFIRMED',N'jggozum (MG Bacoor)','2025-10-01 14:15:14.060',N'jggozum (MG Bacoor)','2025-10-01 14:15:26.263',1,N'SCHEDULED',N'OLD',NULL,13,5,N'BOOKED',NULL,NULL,NULL,NULL UNION ALL
select 5,5,N'MARK VILLEGAS',N'09129992002','2025-10-01 00:00:00.000',16,5,N'BBG808',N'1',N'BLACK SMOKE',NULL,NULL,NULL,NULL,N'CONFIRMED',N'jggozum (MG Bacoor)','2025-10-01 14:17:07.837',N'jggozum (MG Bacoor)','2025-10-01 18:47:36.183',1,N'WALK-IN',N'NEW',NULL,18,11,N'ONGOING','2025-10-01 14:17:00.000',NULL,NULL,NULL UNION ALL
select 6,6,N'RAMON VILLEGAS',N'09182234112','2025-10-01 00:00:00.000',14,6,N'PPP2212',N'1',NULL,NULL,NULL,NULL,NULL,N'CONFIRMED',N'jggozum (MG Bacoor)','2025-10-01 18:40:17.263',N'jggozum (MG Bacoor)','2025-10-01 18:46:16.737',1,N'WALK-IN',N'OLD',NULL,0,0,N'PENDING','2025-10-01 16:00:00.000',NULL,NULL,'2025-10-02 00:00:00.000' UNION ALL
select 7,2,N'JUN KING MANZANO',N'09112372231','2025-10-02 00:00:00.000',11,7,N'PFU8911',N'1',NULL,NULL,NULL,NULL,NULL,N'TENTATIVE',N'jggozum (MG Bacoor)','2025-10-01 19:47:46.417',NULL,NULL,1,N'SCHEDULED',N'OLD',NULL,0,0,N'BOOKED',NULL,NULL,NULL,NULL UNION ALL
select 8,95,N'EZRA RIVERA',N'09145484085','2025-10-02 00:00:00.000',8,188,N'SFF6009',N'1',NULL,NULL,NULL,NULL,N'PMS - OUTSIDE MG',N'CONFIRMED',N'jggozum (MG Bacoor)','2025-10-02 15:14:26.037',N'jggozum (MG Bacoor)','2025-10-02 21:36:53.970',1,N'SCHEDULED',N'OLD',NULL,0,0,N'BOOKED',NULL,NULL,NULL,NULL;

set identity_insert [#tempAppointments] off;