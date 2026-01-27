const _ = require('lodash');

module.exports.dashboardData = (payload) => {
  const stub = {
    deadline: '2026-03-31',
    daysRemaining: '42',
    notUploaded: 56,
    uploaded: 127,
    localAuthorities: [
      {
        id: '001',
        authorityName: 'Springfield City Council',
        status: 'Not uploaded',
        lastDataUpload: '2024-03-23'
      },
      {
        id: '002',
        authorityName: 'Shelbyville Borough Council',
        status: 'Uploaded',
        lastDataUpload: '2024-06-10'
      },
      {
        id: '003',
        authorityName: 'Ogdenville District Council',
        status: 'Uploaded',
        lastDataUpload: '2024-06-12'
      },
      {
        id: '004',
        authorityName: 'North Haverbrook Council',
        status: 'Not uploaded',
        lastDataUpload: '2024-02-15'
      }
    ],
  }

  if (payload && payload.localAuthorityFilter) {
    stub.localAuthorities = stub.localAuthorities.filter(
      (la) => la.authorityName.toLowerCase().includes(payload.localAuthorityFilter.toLowerCase())
    );
  }
  if (payload && payload.status && payload.status !== 'all') {
    stub.localAuthorities = stub.localAuthorities.filter(
      (la) => _.camelCase(la.status) === _.camelCase(payload.status)
    );
  }

  return stub;
};

module.exports.allLocalAuthorities = {
  localAuthorities: [
    {
      id: '001',
      authorityName: 'Springfield City Council',
    },
    {
      id: '002',
      authorityName: 'Shelbyville Borough Council',
    },
    {
      id: '003',
      authorityName: 'Ogdenville District Council',
    },
    {
      id: '004',
      authorityName: 'North Haverbrook Council',
    },
    {
      id: '005',
      authorityName: 'Capital City Council',
    },
    {
      id: '006',
      authorityName: 'Cypress Creek Council',
    }
  ],
};