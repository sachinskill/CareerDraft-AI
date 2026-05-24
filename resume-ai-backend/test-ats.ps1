$ApiUrl = "http://localhost:8081/api/v1/resume/analyze-ats"

$JobDescription = @"
We are seeking a highly skilled Senior Software Engineer to design and implement functional software solutions. Collaborating with upper management, you will play a key role in defining software requirements and assuming leadership of operational and technical projects. In this position, you will have the opportunity to work autonomously with minimal supervision, leveraging your exceptional organizational and problem-solving abilities. A strong background in software development and familiarity with agile methodologies are essential. Your primary objective will be to develop high-quality software solutions that meet user needs and align with the organization's business goals. This will involve analyzing requirements, designing robust architectures, writing efficient code, and conducting thorough testing. As a Senior Software Engineer, you will have the responsibility to drive projects forward, mentor junior team members, and contribute to continuous improvement initiatives. By delivering innovative and reliable software, you will contribute to the success of our organization and make a meaningful impact in the industry.

Responsibilities
Develop high-quality software design and architecture
Identify, prioritize and execute tasks in the software development life cycle
Develop tools and applications by producing clean, efficient code
Automate tasks through appropriate tools and scripting
Review and debug code
Perform validation and verification testing
Collaborate with internal teams and vendors to fix and improve products
Document development phases and monitor systems
Ensure software is up-to-date with latest technologies
"@

$ResumeData = @{
    basics = @{
        name = "Sourabh Bajaj"
    }
    skills = @(
        @{ name = "Java, Python, C++, SQL, Git, Linux, Docker, AWS, Redshift, Hadoop, Cassandra" }
    )
    experience = @(
        @{
            description = "Worked on APIs and performance for training models on Tensor Processing Units (TPU)."
        }
    )
}

$Payload = @{
    jobDescription = $JobDescription
    resumeData = $ResumeData
}

$JsonPayload = $Payload | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri $ApiUrl -Method Post -Body $JsonPayload -ContentType "application/json" | ConvertTo-Json -Depth 5
