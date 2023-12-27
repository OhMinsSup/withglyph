import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as tls from '@pulumi/tls';
import { buckets } from './s3';

const team = new aws.iam.Group('team', {
  name: 'team',
});

new aws.iam.GroupPolicy('team', {
  group: team.name,
  policy: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'iam:GetUser',
          'iam:ChangePassword',
          'iam:GetAccessKeyLastUsed',
          'iam:ListAccessKeys',
          'iam:CreateAccessKey',
          'iam:UpdateAccessKey',
          'iam:DeleteAccessKey',
        ],
        Resource: 'arn:aws:iam::*:user/${aws:username}',
      },
      {
        Effect: 'Allow',
        Action: ['s3:GetObject', 's3:PutObject'],
        Resource: [pulumi.concat(buckets.data.arn, '/*'), pulumi.concat(buckets.uploads.arn, '/*')],
      },
      {
        Effect: 'Allow',
        Action: ['s3:DeleteObject'],
        Resource: [pulumi.concat(buckets.uploads.arn, '/*')],
      },
      {
        Effect: 'Allow',
        Action: ['ses:SendEmail'],
        Resource: ['*'],
      },
    ],
  },
});

const datadogIntegration = new aws.iam.Role('integration@datadog', {
  name: 'integration@datadog',
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    AWS: '417141415827',
  }),
});

new aws.iam.RolePolicy('integration@datadog', {
  role: datadogIntegration.name,
  policy: {
    Version: '2012-10-17',
    Statement: [
      {
        Action: [
          'apigateway:GET',
          'autoscaling:Describe*',
          'backup:List*',
          'budgets:ViewBudget',
          'ce:Get*',
          'cloudfront:GetDistributionConfig',
          'cloudfront:ListDistributions',
          'cloudtrail:DescribeTrails',
          'cloudtrail:GetTrailStatus',
          'cloudtrail:LookupEvents',
          'cloudwatch:Describe*',
          'cloudwatch:Get*',
          'cloudwatch:List*',
          'codedeploy:List*',
          'codedeploy:BatchGet*',
          'cur:DescribeReportDefinitions',
          'directconnect:Describe*',
          'dynamodb:List*',
          'dynamodb:Describe*',
          'ec2:Describe*',
          'ecs:Describe*',
          'ecs:List*',
          'elasticache:Describe*',
          'elasticache:List*',
          'elasticfilesystem:DescribeFileSystems',
          'elasticfilesystem:DescribeTags',
          'elasticfilesystem:DescribeAccessPoints',
          'elasticloadbalancing:Describe*',
          'elasticmapreduce:List*',
          'elasticmapreduce:Describe*',
          'es:ListTags',
          'es:ListDomainNames',
          'es:DescribeElasticsearchDomains',
          'events:CreateEventBus',
          'fsx:DescribeFileSystems',
          'fsx:ListTagsForResource',
          'health:DescribeEvents',
          'health:DescribeEventDetails',
          'health:DescribeAffectedEntities',
          'kinesis:List*',
          'kinesis:Describe*',
          'lambda:GetPolicy',
          'lambda:List*',
          'logs:DeleteSubscriptionFilter',
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams',
          'logs:DescribeSubscriptionFilters',
          'logs:FilterLogEvents',
          'logs:PutSubscriptionFilter',
          'logs:TestMetricFilter',
          'organizations:Describe*',
          'organizations:List*',
          'rds:Describe*',
          'rds:List*',
          'redshift:DescribeClusters',
          'redshift:DescribeClusterParameterGroups',
          'redshift:DescribeLoggingStatus',
          'route53:List*',
          's3:GetAccountPublicAccessBlock',
          's3:GetBucketAcl',
          's3:GetBucketLogging',
          's3:GetBucketLocation',
          's3:GetBucketNotification',
          's3:GetBucketPolicyStatus',
          's3:GetBucketPublicAccessBlock',
          's3:GetBucketTagging',
          's3:GetBucketVersioning',
          's3:GetBucketWebsite',
          's3:GetEncryptionConfiguration',
          's3:GetObject',
          's3:ListAllMyBuckets',
          's3:ListBucket',
          's3:PutBucketNotification',
          'ses:Get*',
          'sns:List*',
          'sns:Publish',
          'sqs:ListQueues',
          'states:ListStateMachines',
          'states:DescribeStateMachine',
          'support:DescribeTrustedAdvisor*',
          'support:RefreshTrustedAdvisorCheck',
          'tag:GetResources',
          'tag:GetTagKeys',
          'tag:GetTagValues',
          'xray:BatchGetTraces',
          'xray:GetTraceSummaries',
        ],
        Effect: 'Allow',
        Resource: '*',
      },
    ],
  },
});

const githubActionsCertificate = tls.getCertificateOutput({
  url: 'https://token.actions.githubusercontent.com',
});

const githubActionsOidcProvider = new aws.iam.OpenIdConnectProvider('actions@github', {
  url: 'https://token.actions.githubusercontent.com',
  clientIdLists: ['sts.amazonaws.com'],
  thumbprintLists: [githubActionsCertificate.certificates[0].sha1Fingerprint],
});

const githubActionsRole = new aws.iam.Role('actions@github', {
  name: 'actions@github',
  assumeRolePolicy: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { Federated: githubActionsOidcProvider.arn },
        Action: 'sts:AssumeRoleWithWebIdentity',
        Condition: {
          StringLike: {
            'token.actions.githubusercontent.com:sub': 'repo:penxle/*',
          },
          StringEquals: {
            'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          },
        },
      },
    ],
  },
});

new aws.iam.RolePolicy('actions@github', {
  role: githubActionsRole.name,
  policy: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'ecr:BatchCheckLayerAvailability',
          'ecr:BatchGetImage',
          'ecr:CompleteLayerUpload',
          'ecr:DescribeImages',
          'ecr:GetAuthorizationToken',
          'ecr:GetDownloadUrlForLayer',
          'ecr:InitiateLayerUpload',
          'ecr:PutImage',
          'ecr:UploadLayerPart',
          'eks:DescribeCluster',
          'iam:CreateRole',
          'iam:DeleteRole',
          'iam:DeleteRolePolicy',
          'iam:DetachRolePolicy',
          'iam:GetRole',
          'iam:GetRolePolicy',
          'iam:ListAttachedRolePolicies',
          'iam:ListInstanceProfilesForRole',
          'iam:ListRolePolicies',
          'iam:PutRolePolicy',
          'lambda:GetFunction',
          'lambda:ListVersionsByFunction',
          'lambda:UpdateFunctionCode',
          'route53:GetHostedZone',
          'route53:ListHostedZones',
          'route53:ListTagsForResource',
          'sts:GetCallerIdentity',
        ],
        Resource: '*',
      },
    ],
  },
});
