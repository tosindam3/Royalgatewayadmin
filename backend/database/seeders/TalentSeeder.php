<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\JobOpening;
use App\Models\Candidate;
use App\Models\Application;
use App\Models\Department;
use App\Models\Branch;
use App\Models\User;
use Carbon\Carbon;

class TalentSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding Talent Management data...');

        // Get first user as creator
        $creator = User::first();
        if (!$creator) {
            $this->command->error('No users found. Please seed users first.');
            return;
        }

        // Get departments and branches
        $departments = Department::all();
        $branches = Branch::all();

        if ($departments->isEmpty()) {
            $this->command->warn('No departments found. Creating sample department...');
            $departments = collect([
                Department::create(['name' => 'Engineering', 'code' => 'ENG']),
                Department::create(['name' => 'Marketing', 'code' => 'MKT']),
                Department::create(['name' => 'Sales', 'code' => 'SAL']),
            ]);
        }

        // Create Job Openings
        $jobs = [
            [
                'title' => 'Senior Software Engineer',
                'description' => 'We are looking for an experienced software engineer to join our growing team. You will be responsible for designing, developing, and maintaining high-quality software solutions.',
                'requirements' => "• 5+ years of experience in software development\n• Strong proficiency in PHP, Laravel, and React\n• Experience with RESTful APIs and microservices\n• Excellent problem-solving skills\n• Bachelor's degree in Computer Science or related field",
                'responsibilities' => "• Design and develop scalable web applications\n• Write clean, maintainable code\n• Collaborate with cross-functional teams\n• Mentor junior developers\n• Participate in code reviews",
                'department_id' => $departments->first()->id,
                'branch_id' => $branches->first()->id ?? null,
                'location' => 'Remote',
                'employment_type' => 'full_time',
                'experience_level' => 'senior',
                'openings' => 2,
                'status' => 'active',
                'posted_date' => Carbon::now()->subDays(5),
                'closing_date' => Carbon::now()->addDays(25),
                'created_by' => $creator->id,
            ],
            [
                'title' => 'Product Marketing Manager',
                'description' => 'Join our marketing team to drive product positioning, messaging, and go-to-market strategies.',
                'requirements' => "• 3+ years in product marketing\n• Strong analytical and communication skills\n• Experience with B2B SaaS products\n• Data-driven mindset",
                'responsibilities' => "• Develop product positioning and messaging\n• Create marketing collateral\n• Conduct market research\n• Collaborate with sales team",
                'department_id' => $departments->skip(1)->first()->id ?? $departments->first()->id,
                'branch_id' => $branches->first()->id ?? null,
                'location' => 'Lagos, Nigeria',
                'employment_type' => 'full_time',
                'experience_level' => 'mid',
                'openings' => 1,
                'status' => 'active',
                'posted_date' => Carbon::now()->subDays(10),
                'closing_date' => Carbon::now()->addDays(20),
                'created_by' => $creator->id,
            ],
            [
                'title' => 'UX Designer',
                'description' => 'We need a talented UX designer to create intuitive and beautiful user experiences.',
                'requirements' => "• 2+ years of UX design experience\n• Proficiency in Figma and Adobe XD\n• Strong portfolio\n• Understanding of user-centered design",
                'responsibilities' => "• Create wireframes and prototypes\n• Conduct user research\n• Design user interfaces\n• Collaborate with developers",
                'department_id' => $departments->first()->id,
                'branch_id' => null,
                'location' => 'Remote',
                'employment_type' => 'full_time',
                'experience_level' => 'mid',
                'openings' => 1,
                'status' => 'active',
                'posted_date' => Carbon::now()->subDays(3),
                'closing_date' => Carbon::now()->addDays(27),
                'created_by' => $creator->id,
            ],
            [
                'title' => 'Sales Development Representative',
                'description' => 'Help us grow by identifying and qualifying new business opportunities.',
                'requirements' => "• 1+ years in sales or business development\n• Excellent communication skills\n• Self-motivated and goal-oriented\n• CRM experience preferred",
                'responsibilities' => "• Generate new leads\n• Qualify prospects\n• Schedule demos\n• Maintain CRM records",
                'department_id' => $departments->skip(2)->first()->id ?? $departments->first()->id,
                'branch_id' => $branches->first()->id ?? null,
                'location' => 'London, UK',
                'employment_type' => 'full_time',
                'experience_level' => 'entry',
                'openings' => 3,
                'status' => 'active',
                'posted_date' => Carbon::now()->subDays(7),
                'closing_date' => Carbon::now()->addDays(23),
                'created_by' => $creator->id,
            ],
            [
                'title' => 'DevOps Engineer',
                'description' => 'Join our infrastructure team to build and maintain our cloud infrastructure.',
                'requirements' => "• 3+ years of DevOps experience\n• Strong knowledge of AWS/Azure\n• Experience with Docker and Kubernetes\n• CI/CD pipeline expertise",
                'responsibilities' => "• Manage cloud infrastructure\n• Implement CI/CD pipelines\n• Monitor system performance\n• Ensure security best practices",
                'department_id' => $departments->first()->id,
                'branch_id' => null,
                'location' => 'Remote',
                'employment_type' => 'full_time',
                'experience_level' => 'senior',
                'openings' => 1,
                'status' => 'active',
                'posted_date' => Carbon::now()->subDays(2),
                'closing_date' => Carbon::now()->addDays(28),
                'created_by' => $creator->id,
            ],
            [
                'title' => 'Marketing Intern',
                'description' => 'Great opportunity for students to gain hands-on marketing experience.',
                'requirements' => "• Currently pursuing degree in Marketing or related field\n• Strong writing skills\n• Social media savvy\n• Eager to learn",
                'responsibilities' => "• Assist with content creation\n• Manage social media accounts\n• Support marketing campaigns\n• Conduct market research",
                'department_id' => $departments->skip(1)->first()->id ?? $departments->first()->id,
                'branch_id' => null,
                'location' => 'Remote',
                'employment_type' => 'intern',
                'experience_level' => 'entry',
                'openings' => 2,
                'status' => 'active',
                'posted_date' => Carbon::now()->subDays(1),
                'closing_date' => Carbon::now()->addDays(29),
                'created_by' => $creator->id,
            ],
        ];

        foreach ($jobs as $jobData) {
            JobOpening::create($jobData);
        }

        $this->command->info('Created ' . count($jobs) . ' job openings');

        // Create sample candidates and applications
        $jobOpenings = JobOpening::all();
        $users = User::limit(5)->get();

        foreach ($users as $index => $user) {
            // Create candidate
            $candidate = Candidate::create([
                'first_name' => explode(' ', $user->name)[0] ?? 'John',
                'last_name' => explode(' ', $user->name)[1] ?? 'Doe',
                'email' => $user->email,
                'phone' => '+234' . rand(7000000000, 9999999999),
                'source' => ['linkedin', 'indeed', 'referral', 'direct'][rand(0, 3)],
                'overall_rating' => rand(30, 50) / 10,
                'user_id' => $user->id,
            ]);

            // Create 1-2 applications per candidate
            $numApplications = rand(1, 2);
            $selectedJobs = $jobOpenings->random(min($numApplications, $jobOpenings->count()));

            foreach ($selectedJobs as $job) {
                $stages = ['applied', 'screening', 'technical', 'interview', 'offer'];
                $stage = $stages[rand(0, count($stages) - 1)];

                Application::create([
                    'candidate_id' => $candidate->id,
                    'job_opening_id' => $job->id,
                    'stage' => $stage,
                    'status' => 'active',
                    'applied_date' => Carbon::now()->subDays(rand(1, 10)),
                    'cover_letter' => "I am very interested in the {$job->title} position. I believe my skills and experience make me a great fit for this role.",
                ]);
            }
        }

        $this->command->info('Created sample candidates and applications');
        $this->command->info('Talent Management seeding completed!');
    }
}
