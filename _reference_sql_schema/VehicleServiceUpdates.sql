--create table [#tempVehicleServiceUpdates] (
--[Id] [int] identity,
--[appointment_id] [int] NULL,
--[plate_no] [nvarchar] (20) NULL,
--[update_comment] [nvarchar] (max) NULL,
--[service_status] [nvarchar] (20) NULL,
--[added_by] [nvarchar] (50) NULL,
--[date_added] [datetime] NULL,
--[is_missing_parts] [smallint] NULL);



set identity_insert [#tempVehicleServiceUpdates] on;


insert [#tempVehicleServiceUpdates] ([Id],[appointment_id],[plate_no],[update_comment],[service_status],[added_by],[date_added],[is_missing_parts])
select 1,1,N'NEY667',N'Service booked',N'BOOKED',N'jggozum (MG Bacoor)','2025-10-01 13:34:03.000',NULL UNION ALL
select 2,1,N'NEY667',NULL,N'ARRIVED',N'jggozum (MG Bacoor)','2025-10-01 14:06:45.643',0 UNION ALL
select 3,2,N'POL2912',N'Service booked',N'BOOKED',N'jggozum (MG Bacoor)','2025-10-01 14:08:05.357',NULL UNION ALL
select 4,2,N'POL2912',NULL,N'ARRIVED',N'jggozum (MG Bacoor)','2025-10-01 14:08:49.000',0 UNION ALL
select 5,2,N'POL2912',N'Diagnosis completed.',N'DIAGNOSED',N'jggozum (MG Bacoor)','2025-10-01 14:10:49.527',NULL UNION ALL
select 6,2,N'POL2912',N'PMS STARTED...',N'ONGOING',N'jggozum (MG Bacoor)','2025-10-01 14:11:20.417',0 UNION ALL
select 7,3,N'XAY0099',N'Service booked',N'BOOKED',N'jggozum (MG Bacoor)','2025-10-01 14:12:41.537',NULL UNION ALL
select 8,3,N'XAY0099',N'CAR ARRIVED',N'ARRIVED',N'jggozum (MG Bacoor)','2025-10-01 14:13:17.983',0 UNION ALL
select 9,3,N'XAY0099',N'WAITING FOR CLUTCH ASSEMBLY',N'PENDING',N'jggozum (MG Bacoor)','2025-10-01 14:14:05.100',1 UNION ALL
select 10,4,N'TIN2211',N'Service booked',N'BOOKED',N'jggozum (MG Bacoor)','2025-10-01 14:15:14.083',NULL UNION ALL
select 11,5,N'BBG808',N'Service booked',N'BOOKED',N'jggozum (MG Bacoor)','2025-10-01 14:17:07.857',NULL UNION ALL
select 12,5,N'BBG808',NULL,N'ARRIVED',N'jggozum (MG Bacoor)','2025-10-01 14:17:53.430',0 UNION ALL
select 13,5,N'BBG808',N'REMOVED OIL FILTER',N'ONGOING',N'jggozum (MG Bacoor)','2025-10-01 14:18:15.693',0 UNION ALL
select 14,6,N'PPP2212',N'Service booked',N'BOOKED',N'jggozum (MG Bacoor)','2025-10-01 18:40:17.300',NULL UNION ALL
select 15,6,N'PPP2212',N'BMW ARRIVED',N'ARRIVED',N'jggozum (MG Bacoor)','2025-10-01 18:41:17.210',0 UNION ALL
select 16,6,N'PPP2212',N'Diagnosis completed.',N'DIAGNOSED',N'jggozum (MG Bacoor)','2025-10-01 18:44:47.100',NULL UNION ALL
select 17,6,N'PPP2212',N'BAKLAS NA UNG HOOD',N'ONGOING',N'jggozum (MG Bacoor)','2025-10-01 18:45:34.187',0 UNION ALL
select 18,6,N'PPP2212',N'WAITING PA SA OIL FILTER',N'PENDING',N'jggozum (MG Bacoor)','2025-10-01 18:46:16.747',1 UNION ALL
select 19,2,N'POL2912',N'PENDING. WALA SYANG PAMBAYAD',N'PENDING',N'jggozum (MG Bacoor)','2025-10-01 18:47:00.637',0 UNION ALL
select 20,5,N'BBG808',N'NAIBALIK NA YUNG OIL SEAL',N'POST',N'jggozum (MG Bacoor)','2025-10-01 18:47:36.203',0 UNION ALL
select 21,1,N'NEY667',N'UMALIS PO UNG DRIVER. NASA KANYA SUSI',N'POST',N'jggozum (MG Bacoor)','2025-10-01 18:48:11.743',0 UNION ALL
select 22,7,N'PFU8911',N'Service booked',N'BOOKED',N'jggozum (MG Bacoor)','2025-10-01 19:47:46.457',NULL UNION ALL
select 23,8,N'SFF6009',N'Service booked',N'BOOKED',N'jggozum (MG Bacoor)','2025-10-02 15:14:26.187',NULL;

set identity_insert [#tempVehicleServiceUpdates] off;