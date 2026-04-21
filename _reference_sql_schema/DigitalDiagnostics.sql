--create table [#tempDigitalDiagnostics] (
--[Id] [int] identity,
--[appointment_id] [int] NULL,
--[qoutation_code] [nvarchar] (50) NULL,
--[vehicle_id] [int] NULL,
--[plate_no] [nvarchar] (20) NULL,
--[latest_odometer] [int] NULL,
--[actual_unit_concern] [nvarchar] (max) NULL,
--[actual_diagnosis_notes] [nvarchar] (max) NULL,
--[fault_codes] [nvarchar] (max) NULL,
--[diagnosis_recommendation] [nvarchar] (max) NULL,
--[is_completed] [nvarchar] (10) NULL,
--[next_pms_schedule] [datetime] NULL,
--[next_pms_odometer] [int] NULL,
--[next_steps_recommendation] [nvarchar] (max) NULL,
--[other_remarks] [nvarchar] (max) NULL,
--[scope_of_work_done] [nvarchar] (max) NULL,
--[added_by] [nvarchar] (50) NULL,
--[datetime_added] [datetime] NULL,
--[updated_by] [nvarchar] (50) NULL,
--[datetime_updated] [datetime] NULL,
--[datetime_diagnosis] [datetime] NULL);



set identity_insert [#tempDigitalDiagnostics] on;


insert [#tempDigitalDiagnostics] ([Id],[appointment_id],[qoutation_code],[vehicle_id],[plate_no],[latest_odometer],[actual_unit_concern],[actual_diagnosis_notes],[fault_codes],[diagnosis_recommendation],[is_completed],[next_pms_schedule],[next_pms_odometer],[next_steps_recommendation],[other_remarks],[scope_of_work_done],[added_by],[datetime_added],[updated_by],[datetime_updated],[datetime_diagnosis])
select 1,2,NULL,2,N'POL2912',0,N'DELAY ACCELERATION/SHIFTING',N'test diagnosis result',NULL,N'pms',NULL,NULL,NULL,NULL,NULL,NULL,N'jggozum (MG Bacoor)','2025-10-01 14:10:49.457',NULL,NULL,'2025-10-01 14:10:00.000' UNION ALL
select 2,6,NULL,6,N'PPP2212',0,N'BLACK SMOKE',N'test diagnosis',NULL,N'test recommendation',NULL,NULL,NULL,NULL,NULL,NULL,N'jggozum (MG Bacoor)','2025-10-01 18:44:46.953',NULL,NULL,'2025-10-01 18:41:00.000';

set identity_insert [#tempDigitalDiagnostics] off;