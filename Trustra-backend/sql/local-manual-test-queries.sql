-- Manual local DB helpers for PostgreSQL.
-- Run these from psql against the same database your Spring Boot app uses.

create extension if not exists pgcrypto;

-- 1. Check current trust users
select user_id, score, success_rate, dispute_rate, average_rating, last_activity_at, calculated_at
from user_trust_scores
order by user_id;

-- 2. Insert named users for manual UI/API testing
insert into user_trust_scores (
	user_id,
	score,
	success_rate,
	dispute_rate,
	average_rating,
	last_activity_at,
	calculated_at
) values
	('alice', 82.0, 96.0, 1.0, 4.9, now() - interval '2 days', now()),
	('bob', 76.0, 91.0, 2.0, 4.6, now() - interval '3 days', now()),
	('carol', 71.0, 89.0, 3.0, 4.4, now() - interval '5 days', now()),
	('dave', 65.0, 84.0, 5.0, 4.1, now() - interval '9 days', now()),
	('eve', 58.0, 78.0, 7.0, 3.8, now() - interval '12 days', now()),
	('mallory', 44.0, 68.0, 12.0, 3.0, now() - interval '16 days', now()),
	('trent', 80.0, 94.0, 1.0, 4.8, now() - interval '1 day', now()),
	('peggy', 74.0, 88.0, 3.0, 4.3, now() - interval '4 days', now()),
	('victor', 62.0, 82.0, 6.0, 3.9, now() - interval '11 days', now()),
	('walter', 55.0, 75.0, 8.0, 3.5, now() - interval '18 days', now()),
	('judy', 79.0, 93.0, 2.0, 4.7, now() - interval '2 days', now()),
	('oscar', 67.0, 86.0, 4.0, 4.0, now() - interval '7 days', now())
on conflict (user_id) do update
set
	score = excluded.score,
	success_rate = excluded.success_rate,
	dispute_rate = excluded.dispute_rate,
	average_rating = excluded.average_rating,
	last_activity_at = excluded.last_activity_at,
	calculated_at = now();

-- 3. Create 100 generated local test users manually
insert into user_trust_scores (
	user_id,
	score,
	success_rate,
	dispute_rate,
	average_rating,
	last_activity_at,
	calculated_at
)
select
	format('local-test-%s', lpad(gs::text, 3, '0')),
	round((55 + random() * 30)::numeric, 2),
	round((70 + random() * 28)::numeric, 2),
	round((random() * 8)::numeric, 2),
	round((3.6 + random() * 1.3)::numeric, 2),
	now() - ((random() * 20)::int || ' days')::interval,
	now()
from generate_series(1, 100) as gs
on conflict (user_id) do nothing;

-- 4. Lookup one user manually
select *
from user_trust_scores
where user_id = 'alice';

-- 5. Create a manual transaction for trust recalculation tests
insert into trust_transactions (
	id,
	sender_id,
	receiver_id,
	amount,
	status,
	created_at
) values (
	gen_random_uuid(),
	'alice',
	'bob',
	125.50,
	'SUCCESS',
	now()
);

-- 6. Create manual feedback for trust recalculation tests
insert into trust_feedback (
	id,
	from_user_id,
	to_user_id,
	rating,
	type,
	comment,
	created_at
) values (
	gen_random_uuid(),
	'alice',
	'bob',
	5,
	'POSITIVE',
	'Manual local DB test feedback',
	now()
);

-- 7. Cleanup only the generated local test users
delete from trust_score_explanations
where user_id like 'local-test-%';

delete from abuse_flags
where user_id like 'local-test-%';

delete from trust_feedback
where from_user_id like 'local-test-%'
   or to_user_id like 'local-test-%';

delete from trust_transactions
where sender_id like 'local-test-%'
   or receiver_id like 'local-test-%';

delete from user_trust_scores
where user_id like 'local-test-%';

-- 8. Cleanup the named sample users
delete from trust_score_explanations
where user_id in ('alice', 'bob', 'carol', 'dave', 'eve', 'mallory', 'trent', 'peggy', 'victor', 'walter', 'judy', 'oscar');

delete from abuse_flags
where user_id in ('alice', 'bob', 'carol', 'dave', 'eve', 'mallory', 'trent', 'peggy', 'victor', 'walter', 'judy', 'oscar');

delete from trust_feedback
where from_user_id in ('alice', 'bob', 'carol', 'dave', 'eve', 'mallory', 'trent', 'peggy', 'victor', 'walter', 'judy', 'oscar')
   or to_user_id in ('alice', 'bob', 'carol', 'dave', 'eve', 'mallory', 'trent', 'peggy', 'victor', 'walter', 'judy', 'oscar');

delete from trust_transactions
where sender_id in ('alice', 'bob', 'carol', 'dave', 'eve', 'mallory', 'trent', 'peggy', 'victor', 'walter', 'judy', 'oscar')
   or receiver_id in ('alice', 'bob', 'carol', 'dave', 'eve', 'mallory', 'trent', 'peggy', 'victor', 'walter', 'judy', 'oscar');

delete from user_trust_scores
where user_id in ('alice', 'bob', 'carol', 'dave', 'eve', 'mallory', 'trent', 'peggy', 'victor', 'walter', 'judy', 'oscar');
